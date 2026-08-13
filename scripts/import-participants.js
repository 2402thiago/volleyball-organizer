"use strict";
const fs = require('fs');
const path = require('path');
const { createParticipant } = require('../src/lib/db');
async function importParticipants() {
    try {
        // Read the CSV file we extracted earlier (located one level up from project root)
        const csvPath = path.join(__dirname, '..', 'participants.csv');
        const csvData = fs.readFileSync(csvPath, 'utf8');
        // Parse CSV (simple split by lines, then by commas)
        const lines = csvData.trim().split('\n');
        const header = lines[0];
        const dataLines = lines.slice(1);
        console.log(`Found ${dataLines.length} participants to import`);
        let successCount = 0;
        let errorCount = 0;
        for (const line of dataLines) {
            try {
                // Simple CSV parsing - assuming no commas in quoted fields for simplicity
                const [name, photoUrl, gender] = line.split(',');
                if (!name || !photoUrl || !gender) {
                    console.warn(`Skipping invalid line: ${line}`);
                    errorCount++;
                    continue;
                }
                await createParticipant({
                    name: name.trim(),
                    photoUrl: photoUrl.trim(),
                    gender: gender.trim() // Will be 'M' or 'F'
                });
                successCount++;
                // Progress indicator
                if (successCount % 10 === 0) {
                    console.log(`Imported ${successCount} participants...`);
                }
            }
            catch (error) {
                console.error(`Error importing participant from line "${line}":`, error);
                errorCount++;
            }
        }
        console.log(`Import completed: ${successCount} successful, ${errorCount} errors`);
    }
    catch (error) {
        console.error('Failed to import participants:', error);
        process.exit(1);
    }
}
// Run the import
importParticipants();
