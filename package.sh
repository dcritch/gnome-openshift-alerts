#!/bin/bash

set -e
zip -r -xclusters.yaml.example -xgnome-openshift-alerts.png -xinstall.sh -xuninstall.sh  gnome-openshift-alerts.zip *
