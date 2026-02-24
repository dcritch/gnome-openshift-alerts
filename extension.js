import GObject from 'gi://GObject';
import St from 'gi://St';
import Gio from 'gi://Gio';
import Soup from 'gi://Soup';
import GLib from 'gi://GLib';
import Clutter from 'gi://Clutter';

import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';

const REFRESH_INTERVAL = 60; // seconds

const OpenshiftAlertsIndicator = GObject.registerClass(
class OpenshiftAlertsIndicator extends PanelMenu.Button {
    _init(extension) {
        super._init(0.0, 'OpenShift Alerts Indicator', false);
        
        this._extension = extension;
        this._clusters = {};
        this._httpSession = new Soup.Session({
            timeout: 2
        });
        
        // Create a box to hold icon and status emoji
        let box = new St.BoxLayout({
            style_class: 'panel-status-menu-box'
        });
        
        // Load OpenShift icon from SVG file
        const ext = Extension.lookupByURL(import.meta.url);
        const file =
            ext.dir.resolve_relative_path(`icons/openshift.svg`);
        this._icon = new St.Icon({
            gicon: new Gio.FileIcon({file}),
            icon_size: 20,
            y_align: Clutter.ActorAlign.CENTER
        });
        
        // Create the status emoji label
        this._statusLabel = new St.Label({
            text: ' 🔵',
            y_align: Clutter.ActorAlign.CENTER
        });
        
        box.add_child(this._icon);
        box.add_child(this._statusLabel);
        this.add_child(box);
        
        // Create menu header
        this._menuSection = new PopupMenu.PopupMenuSection();
        this.menu.addMenuItem(this._menuSection);
        
        // Add refresh button
        let refreshItem = new PopupMenu.PopupMenuItem('↻ Refresh');
        refreshItem.connect('activate', () => {
            this._refreshAlerts();
        });
        this.menu.addMenuItem(refreshItem);
        
        // Initial load
        this._loadConfig();
        this._refreshAlerts();
        
        // Setup auto-refresh timer
        this._timeout = GLib.timeout_add_seconds(
            GLib.PRIORITY_DEFAULT,
            REFRESH_INTERVAL,
            () => {
                this._refreshAlerts();
                return GLib.SOURCE_CONTINUE;
            }
        );
    }
    
    _loadConfig() {
        try {
            const configPath = GLib.build_filenamev([
                GLib.get_home_dir(),
                '.config',
                'ocp-alerts',
                'clusters.yaml'
            ]);
            
            const file = Gio.File.new_for_path(configPath);
            const [success, contents] = file.load_contents(null);
            
            if (success) {
                const configText = new TextDecoder().decode(contents);
                this._clusters = this._parseYaml(configText);
            } else {
                log('OpenShift Alerts: Could not read config file');
                this._clusters = {};
            }
        } catch (e) {
            log(`OpenShift Alerts: Error loading config: ${e.message}`);
            this._clusters = {};
        }
    }
    
    _parseYaml(yamlText) {
        // Simple YAML parser for the config structure
        // This is a basic implementation - assumes the structure matches the Python script
        const clusters = {};
        const lines = yamlText.split('\n');
        let currentCluster = null;
        
        for (let line of lines) {
            line = line.trim();
            if (line.startsWith('#') || line === '' || line === 'clusters:') {
                continue;
            }
            
            // Cluster name (no leading spaces after clusters:)
            if (line.match(/^[\w-]+:$/) && !line.startsWith(' ')) {
                currentCluster = line.slice(0, -1);
                clusters[currentCluster] = {
                    alerts: [],
                    reachable: false
                };
            } else if (currentCluster) {
                // Parse cluster properties
                if (line.includes('url:')) {
                    clusters[currentCluster].url = line.split('url:')[1].trim().replace(/['"]/g, '');
                } else if (line.includes('token:')) {
                    clusters[currentCluster].token = line.split('token:')[1].trim().replace(/['"]/g, '');
                } else if (line.includes('severity:')) {
                    // Parse severity array
                    const severityMatch = line.match(/severity:\s*\[(.*)\]/);
                    if (severityMatch) {
                        clusters[currentCluster].severity = severityMatch[1]
                            .split(',')
                            .map(s => s.trim().replace(/['"]/g, ''));
                    }
                }
            }
        }
        
        return clusters;
    }
    
    _refreshAlerts() {
        for (let clusterName in this._clusters) {
            this._fetchAlertsForCluster(clusterName);
        }
    }
    
    _fetchAlertsForCluster(clusterName) {
        const cluster = this._clusters[clusterName];
        const alertsUrl = `${cluster.url}/api/v2/alerts`;
        
        const message = Soup.Message.new('GET', alertsUrl);
        message.request_headers.append('Authorization', `Bearer ${cluster.token}`);
        
        // Accept all certificates (including self-signed)
        message.connect('accept-certificate', () => {
            return true;
        });
        
        this._httpSession.send_and_read_async(
            message,
            GLib.PRIORITY_DEFAULT,
            null,
            (session, result) => {
                try {
                    const bytes = session.send_and_read_finish(result);
                    const decoder = new TextDecoder('utf-8');
                    const responseText = decoder.decode(bytes.get_data());
                    
                    if (message.status_code === 200) {
                        const alerts = JSON.parse(responseText);
                        
                        // Filter alerts by severity and status
                        cluster.alerts = alerts.filter(alert => {
                            return cluster.severity.includes(alert.labels.severity) &&
                                   alert.status.state !== 'suppressed';
                        });
                        cluster.reachable = true;
                    } else {
                        cluster.reachable = false;
                        cluster.alerts = [{
                            labels: {
                                alertname: 'Could not contact cluster',
                                severity: 'critical'
                            },
                            annotations: {
                                message: `HTTP ${message.status_code}`
                            }
                        }];
                    }
                } catch (e) {
                    cluster.reachable = false;
                    cluster.alerts = [{
                        labels: {
                            alertname: 'Could not contact cluster',
                            severity: 'critical'
                        },
                        annotations: {
                            message: e.message
                        }
                    }];
                }
                
                this._updateUI();
            }
        );
    }
    
    _updateUI() {
        // Update status emoji
        let status = '🟢';
        for (let clusterName in this._clusters) {
            const cluster = this._clusters[clusterName];
            if (!cluster.reachable && status === '🟢') {
                status = '🟡';
            }
            if (cluster.reachable && cluster.alerts.length > 0) {
                status = '🔴';
            }
        }
        this._statusLabel.text = ' ' + status;
        
        // Clear existing menu items
        this._menuSection.removeAll();
        
        // Add cluster information
        for (let clusterName in this._clusters) {
            const cluster = this._clusters[clusterName];
            
            // Cluster header with count
            let countColor = 'green';
            if (!cluster.reachable) {
                countColor = 'yellow';
            } else if (cluster.alerts.length > 0) {
                countColor = 'red';
            }
            
            const headerLabel = new St.Label({
                text: `${clusterName}: ${cluster.alerts.length}`,
                style_class: 'popup-menu-item'
            });
            
            const headerItem = new PopupMenu.PopupBaseMenuItem({
                reactive: false
            });
            headerItem.add_child(headerLabel);
            this._menuSection.addMenuItem(headerItem);
            
            // Add alerts
            if (cluster.alerts.length > 0) {
                for (let alert of cluster.alerts) {
                    const annotations = alert.annotations;
                    let msg = annotations.summary || 
                             annotations.description || 
                             annotations.message || 
                             'No Data';
                    msg = msg.replace(/\n/g, ' ');
                    
                    // Truncate long messages
                    if (msg.length > 80) {
                        msg = msg.substring(0, 77) + '...';
                    }
                    
                    const alertLabel = new St.Label({
                        text: `  ${alert.labels.alertname}: ${msg}`,
                        style_class: 'popup-menu-item'
                    });
                    
                    const alertItem = new PopupMenu.PopupBaseMenuItem({
                        reactive: false
                    });
                    alertItem.add_child(alertLabel);
                    this._menuSection.addMenuItem(alertItem);
                }
            } else if (cluster.reachable) {
                const noAlertsLabel = new St.Label({
                    text: '  No active alerts',
                    style_class: 'popup-menu-item'
                });
                const noAlertsItem = new PopupMenu.PopupBaseMenuItem({
                    reactive: false
                });
                noAlertsItem.add_child(noAlertsLabel);
                this._menuSection.addMenuItem(noAlertsItem);
            }
            
            // Add separator between clusters
            this._menuSection.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
        }
        
        // If no clusters configured
        if (Object.keys(this._clusters).length === 0) {
            const noConfigLabel = new St.Label({
                text: 'No clusters configured',
                style_class: 'popup-menu-item'
            });
            const noConfigItem = new PopupMenu.PopupBaseMenuItem({
                reactive: false
            });
            noConfigItem.add_child(noConfigLabel);
            this._menuSection.addMenuItem(noConfigItem);
        }
    }
    
    destroy() {
        if (this._timeout) {
            GLib.source_remove(this._timeout);
            this._timeout = null;
        }
        super.destroy();
    }
});

export default class OpenshiftAlertsExtension extends Extension {
    enable() {
        this._indicator = new OpenshiftAlertsIndicator(this);
        Main.panel.addToStatusArea(this.uuid, this._indicator);
    }
    
    disable() {
        if (this._indicator) {
            this._indicator.destroy();
            this._indicator = null;
        }
    }
}

