const dotenv = require('dotenv');
const path = require('path');
const mongoose = require('mongoose');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
    throw new Error('MONGODB_URI environment variable is required');
}

async function clearModels() {
    try {
        console.log('\n=== Clearing Models ===');
        
        // Connect to MongoDB
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('Connected successfully');

        // Get current counts
        const BuildRequest = mongoose.models.BuildRequest || mongoose.model('BuildRequest', new mongoose.Schema({}));
        const BuildClaim = mongoose.models.BuildClaim || mongoose.model('BuildClaim', new mongoose.Schema({}));
        const FarcasterUser = mongoose.models.FarcasterUser || mongoose.model('FarcasterUser', new mongoose.Schema({}));

        const beforeCounts = {
            buildRequests: await BuildRequest.countDocuments(),
            claims: await BuildClaim.countDocuments(),
            users: await FarcasterUser.countDocuments(),
        };

        console.log('\nBefore clearing:');
        console.log('- Build Requests:', beforeCounts.buildRequests);
        console.log('- Claims:', beforeCounts.claims);
        console.log('- Users:', beforeCounts.users);

        // Clear all collections
        console.log('\nClearing collections...');
        await Promise.all([
            BuildRequest.deleteMany({}),
            BuildClaim.deleteMany({}),
            FarcasterUser.deleteMany({}),
        ]);

        // Get final counts
        const afterCounts = {
            buildRequests: await BuildRequest.countDocuments(),
            claims: await BuildClaim.countDocuments(),
            users: await FarcasterUser.countDocuments(),
        };

        console.log('\nAfter clearing:');
        console.log('- Build Requests:', afterCounts.buildRequests);
        console.log('- Claims:', afterCounts.claims);
        console.log('- Users:', afterCounts.users);

        console.log('\nAll models cleared successfully');
        console.log('=====================\n');

        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error('\nError clearing models:', error);
        process.exit(1);
    }
}

// Run the clear
clearModels(); 