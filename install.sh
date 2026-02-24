#!/bin/bash

# Installation script for GNOME Shell OpenShift Alerts Extension

set -e

EXTENSION_UUID="openshift-alerts@dcritch.github.com"
EXTENSION_DIR="$HOME/.local/share/gnome-shell/extensions/$EXTENSION_UUID"
CONFIG_DIR="$HOME/.config/ocp-alerts"

echo "Installing OpenShift Alerts Extension..."

# Create extension directory
echo "Creating extension directory..."
mkdir -p "$EXTENSION_DIR"

# Copy extension files
echo "Copying extension files..."
cp -r metadata.json extension.js stylesheet.css icons "$EXTENSION_DIR/"

echo "Extension files installed to: $EXTENSION_DIR"

# Setup config directory
if [ ! -d "$CONFIG_DIR" ]; then
    echo "Creating config directory..."
    mkdir -p "$CONFIG_DIR"
fi

# Copy example config if clusters.yaml doesn't exist
if [ ! -f "$CONFIG_DIR/clusters.yaml" ]; then
    echo "Copying example config file..."
    cp clusters.yaml.example "$CONFIG_DIR/clusters.yaml"
    echo ""
    echo "⚠️  IMPORTANT: Edit $CONFIG_DIR/clusters.yaml with your cluster details!"
    echo ""
else
    echo "Config file already exists at $CONFIG_DIR/clusters.yaml"
fi

echo ""
echo "✅ Installation complete!"
echo ""
echo "Next steps:"
echo "1. Edit your config file: $CONFIG_DIR/clusters.yaml"
echo "2. Restart GNOME Shell:"
echo "   - On Wayland: Log out and log back in"
echo "   - On X11: Press Alt+F2, type 'r', and press Enter"
echo "3. Enable the extension:"
echo "   gnome-extensions enable $EXTENSION_UUID"
echo ""
echo "Or use the GNOME Extensions application to enable it."

