#!/bin/bash

# Set the repository (update this with your repository)
REPO="andrewjiang/builddit"

# Add secrets from .env file
gh secret set MONGODB_URI --body "mongodb+srv://doadmin:Td19P07i8W6l45cu@db-shortiebot-b98b1cb9.mongo.ondigitalocean.com/admin?retryWrites=true&w=majority"
gh secret set NEYNAR_API_KEY --body "E1AA8282-4331-412F-AABB-586297C530F0"
gh secret set NEYNAR_CLIENT_ID --body "943fc42d-c939-4b87-a61f-94ea16ce346b"
gh secret set NEYNAR_CHANNEL_ID --body "someone-build"

# Next-Auth Configuration (update NEXTAUTH_URL for production)
gh secret set NEXTAUTH_URL --body "https://builddit.xyz"
gh secret set NEXTAUTH_SECRET --body "Mdlslc5BmDPVl/5Xqp03pKKmRYPWBCK6QAB5dAP4RKI="

# Farcaster Auth Configuration (update domain for production)
gh secret set NEXT_PUBLIC_RELAY_URL --body "https://relay.farcaster.xyz"
gh secret set NEXT_PUBLIC_RPC_URL --body "https://mainnet.optimism.io"
gh secret set NEXT_PUBLIC_DOMAIN --body "builddit.xyz"
gh secret set NEXT_PUBLIC_SIWE_URI --body "https://builddit.xyz/login"

# Note: Add these after Digital Ocean setup
# gh secret set DIGITALOCEAN_ACCESS_TOKEN --body "<will-get-from-do>"
# gh secret set DIGITALOCEAN_APP_ID --body "<will-get-from-do>"

echo "Secrets have been set successfully!" 