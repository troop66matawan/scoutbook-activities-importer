const csvToJson = require('csvtojson');
const Scout = require('scoutbook-scout');

const ScoutbookActivities = require('scoutbook-activities');
const ScoutbookCampingLog = require('scoutbook-activities/activityCamping');
const ScoutbookServiceLog = require('scoutbook-activities/activityService');
const ScoutbookHikingLog = require('scoutbook-activities/activityHiking');


exports.scoutbook_activities_importer = function (scouts, importPath) {

    function stringToDate(stringDate) {
        let date;
        if (stringDate !== '') {
            const dateSegments = stringDate.split('/');
            if (dateSegments.length === 3) {
                date = new Date(dateSegments[2], dateSegments[0]-1, dateSegments[1])
            }
        }
        return date;
    }

    return csvToJson()
        .on('header', function (header) {
            console.log(header);
        })
        .fromFile(importPath)
        .then(function (importedData) {
            importedData.forEach(activityRecord => {
                const bsaId = activityRecord['BSA Member ID'];
                const firstName = activityRecord['First Name'];
                const middleName = activityRecord['Middle Name'];
                const lastName = activityRecord['Last Name'];
                const type = activityRecord['Log Type'];
                const date = stringToDate(activityRecord['Date']);

                const Nights = activityRecord['Nights'];
                const Miles = activityRecord['Miles'];
                const Hours = activityRecord['Hours'];

                const location = activityRecord['Location/Name'];
                const Notes = activityRecord['Notes'];

                const scoutKey = bsaId + '_' + firstName + '_' + lastName;
                let scout;
                if (scouts[scoutKey]) {
                    scout = scouts[scoutKey];
                } else {
                    scout = new Scout(bsaId,firstName,middleName,lastName,'');
                    scouts[scoutKey] = scout;
                }

                if (ScoutbookActivities.supportedActivities.includes(type)) {
                    const activities = scout.activities;
                    if (type === 'Camping') {
                        activities.addCamping( new ScoutbookCampingLog(date,Nights,location,Notes));
                    } else if (type === 'Hiking') {
                        activities.addHiking(new ScoutbookHikingLog(date,Miles,location,Notes));
                    }
                    else if (type === 'Service') {
                        activities.addService(new ScoutbookServiceLog(date,Hours,location,Notes));
                    }
                }
            });
            return scouts;
        });
};

if (process.argv.length !== 3) {
    console.log('Usage: ' + process.argv[1] + ' <scoutbook_log.csv file to import>');
} else {
    exports.scoutbook_activities_importer({},process.argv[2])
        .then(function (scouts) {
            console.log(JSON.stringify(scouts));
        })
        .catch(function (err) {
            console.error(err.message);
        });
}

