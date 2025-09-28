#!/bin/bash

set -e

echo "Installing dependencies..."
pnpm i

echo "Running migrator..."
./migrator.sh

echo "Building backend..."
lerna run build --scope backend

echo "Restarting PM2 processes..."
pm2 restart all

echo "Production build completed successfully."