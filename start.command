#!/bin/bash
cd "$(dirname "$0")"
(open index.html 2>/dev/null || xdg-open index.html)
