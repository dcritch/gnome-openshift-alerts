#!/bin/bash

# Uninstallation script for GNOME Shell OpenShift Alerts Extension

EXTENSION_UUID="openshift-alerts@dcritch.github.com"
EXTENSION_DIR="$HOME/.local/share/gnome-shell/extensions/$EXTENSION_UUID"

echo "Uninstalling OpenShift Alerts Extension..."

# Disable extension first
echo "Disabling extension..."
gnome-extensions disable "$EXTENSION_UUID" 2>/dev/null || true

# Remove extension directory
if [ -d "$EXTENSION_DIR" ]; then
    echo "Removing extension directory..."
    rm -rf "$EXTENSION_DIR"
    echo "Extension removed from: $EXTENSION_DIR"
else
    echo "Extension directory not found."
fi

echo ""
echo "✅ Uninstallation complete!"
echo ""
echo "Note: Your config file at ~/.config/ocp-alerts/clusters.yaml was NOT removed."
echo "To remove it manually, run: rm -rf ~/.config/ocp-alerts"

