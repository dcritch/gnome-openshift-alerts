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

// OpenShift logo SVG
const OPENSHIFT_ICON_SVG = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg width="256px" height="237px" viewBox="0 0 256 237" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" preserveAspectRatio="xMidYMid">
	<g>
		<path d="M74.8392681,106.892926 L33.9714147,121.763314 C34.4958336,128.315376 35.6233978,134.787442 37.211892,141.128721 L76.0290516,126.992265 C74.7846677,120.440203 74.3402448,113.672278 74.8481566,106.891656" fill="#DA2430"></path>
		<path d="M255.444071,61.7023618 C252.593416,55.8232827 249.297068,50.1410194 245.477572,44.7863591 L204.621146,59.656747 C209.37647,64.5200025 213.363578,69.9864033 216.628181,75.8324681 L255.445341,61.6998222 L255.444071,61.7023618 L255.444071,61.7023618 Z" fill="#DA2430"></path>
		<g>
			<path d="M182.950275,61.4614413 C177.809695,57.0005792 172.004032,53.1510662 165.54165,50.1365752 L165.53911,50.1365752 C127.598099,32.4485466 82.3304594,48.904889 64.6424308,86.8585985 C63.6454901,89.0001513 62.7625611,91.1647155 61.9886006,93.3462151 C59.7809164,99.7692657 58.4912936,106.33609 57.9978533,112.89241 L57.8539295,112.9456 C57.8501633,112.993635 57.8464406,113.04167 57.8427616,113.089704 L33.2472215,122.039512 L17.4207366,127.888513 C17.418462,127.859314 17.416198,127.830115 17.4139447,127.800914 L16.9799873,127.958822 C15.443554,108.523577 18.7195851,88.4470927 27.5331247,69.5476944 C28.6870135,67.0724846 29.9171924,64.6566205 31.2195686,62.3015921 C60.2738161,8.1856616 126.383568,-14.4341613 182.138317,11.9725342 C193.678037,17.4404824 203.911047,24.6094357 212.694536,33.045511 C218.60401,38.5121214 223.878405,44.5334969 228.475731,50.9860576 L187.616767,65.858985 C187.406509,65.6440827 187.194925,65.4302535 186.982018,65.2175172 L186.868906,65.2593348 C185.610426,63.9523602 184.30416,62.6849771 182.950275,61.4614413 Z" fill="#DA2430"></path>
			<path d="M19.2613217,193.896477 L19.1968952,193.91993 C10.6957214,181.949719 4.50808591,168.501485 0.938735714,154.347253 L39.7635139,140.206988 L39.7660535,140.209528 C39.7740514,140.251306 39.7820838,140.293077 39.7901508,140.334841 L40.04226,140.241601 L40.0481026,140.257181 C42.0422662,150.817822 46.1933636,160.892394 52.2458245,169.750695 C54.5535333,173.043912 57.1321413,176.165653 59.9682455,179.077478 L59.8140535,179.133611 C59.9116663,179.236598 60.0095901,179.33933 60.1078243,179.441803 L19.6202948,194.412587 C19.500171,194.240851 19.380513,194.068813 19.2613217,193.896477 Z" fill="#E82429"></path>
			<path d="M173.465486,183.446858 C152.413934,196.46429 125.412387,198.979252 101.351883,187.758961 C92.8405513,183.78963 85.425039,178.421002 79.2335941,172.064486 L38.4622439,186.908208 C38.5659908,187.054117 38.6700845,187.199805 38.7745245,187.345272 L38.754348,187.352733 C49.9644215,203.36935 65.2565512,216.75678 84.0211549,225.651222 C124.490455,244.814382 170.407927,238.152298 203.655476,212.3668 C218.543486,201.215294 230.971995,186.351361 239.368027,168.347841 C248.186646,149.452252 251.443631,129.383387 249.883072,109.963379 L248.747464,110.376585 C248.73211,110.168574 248.716217,109.960636 248.699785,109.752771 L208.210308,124.709923 L208.212255,124.713818 C207.567618,133.637473 205.349363,142.590341 201.405583,151.173176 C195.091199,164.926539 185.242012,175.882135 173.465486,183.446858 Z" fill="#DA2430"></path>
			<path d="M218.552379,75.1291912 L219.159486,74.9081957 L219.159486,74.9069259 C225.546477,88.0491438 229.444701,102.334163 230.612897,116.962023 L189.840277,131.795587 C189.847816,131.694429 189.855149,131.593274 189.862274,131.492123 L189.091251,131.776983 C190.201352,116.689345 186.816517,101.683505 179.657339,88.6544234 L218.205113,74.4042308 L218.20706,74.4003358 C218.32299,74.6428972 218.438097,74.8858507 218.552379,75.1291912 Z" fill="#E82429"></path>
		</g>
		<path d="M74.8906707,106.654031 L34.309659,121.650133 C34.8296537,128.260104 35.9494925,134.786331 37.5289522,141.182071 L76.0747786,126.924088 C74.8283493,120.302432 74.3804137,113.486022 74.9062511,106.650136" fill="#C22035"></path>
		<path d="M254.22692,61.0828228 C251.397136,55.1544934 248.121364,49.4248137 244.329492,44.0242691 L203.758218,59.0203718 C208.479069,63.9262397 212.43843,69.4377942 215.679146,75.334963 L254.221077,61.0789277 L254.22692,61.0828228 L254.22692,61.0828228 Z" fill="#C22035"></path>
		<path d="M34.3084904,121.652665 L74.7901774,106.824052 L74.624636,114.957003 L35.5685526,129.705767 L34.3026478,121.642928 L34.3084904,121.652665 L34.3084904,121.652665 Z" fill="#AC223B"></path>
		<path d="M203.766009,58.8974817 L244.8787,44.7894599 L249.151615,51.2377841 L209.205504,65.3594386 L203.771851,58.8935866 L203.766009,58.8974817 L203.766009,58.8974817 Z" fill="#AC223B"></path>
		<path d="M38.7638909,187.20102 L79.2942665,172.452256 L91.5521198,184.016782 L49.0488803,199.973025 L38.7658385,187.197125 L38.7638909,187.20102 L38.7638909,187.20102 Z" fill="#B92135"></path>
		<path d="M249.380647,109.861639 L208.215371,124.705833 L205.183043,141.184018 L249.074882,125.54133 L249.38649,109.863587 L249.380647,109.861639 L249.380647,109.861639 Z" fill="#B92135"></path>
	</g>
</svg>`;

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
        
        // Create OpenShift icon from SVG
        let iconBytes = new GLib.Bytes(OPENSHIFT_ICON_SVG);
        this._icon = new St.Icon({
            gicon: Gio.BytesIcon.new(iconBytes),
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

