#!/bin/bash

set -e
rm gnome-openshift-alerts.zip
zip -r -xclusters.yaml.example -xgnome-openshift-alerts.png -xinstall.sh -xuninstall.sh -xpackage.sh gnome-openshift-alerts.zip *
