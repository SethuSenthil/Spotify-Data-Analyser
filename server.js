//Loop through the all folder in Data
//Find the file with StreaminHistory of highest index and import it
//Get the [0] of the json array and save the date and path to an global array

//Arrange the dates in the array from least to greatest
//Loop through array
//Loop through all files with StreamingHistory lowest to highest
//keep track of months
//Master global arr with all songs and all their stats, play counts & play time

const fs = require('fs');

const exportDates = {}
let endDates = []

let indexID = 0, indexArtistID = 0

let global = {
    years: {},
    trackIndexes: {},
    artistIndexes: {},
    revArtistIndexes: {},
    revTrackIndexes: {}
} //instance DB

fs.readdir(__dirname + '/Data/', function (err, files) {
    if (err)
        return console.log('Unable to scan directory: ' + err);

    files.forEach(function (file, fileIndex) {
        if (fileIndex == files.length - 1)
            stichDates()

        if (!file.includes('.')) {
            fs.readdir(__dirname + '/Data/' + file, function (err, subFiles) {
                if (err)
                    return console.log('Unable to scan directory: ' + err);

                let highest = 0; //get the highest indexed file

                subFiles.forEach(function (subFile) {
                    if (subFile.startsWith('StreamingHistory') && subFile.endsWith('.json')) {
                        let fileNum = subFile.split('StreamingHistory')[1].split('.')[0]
                        if (fileNum > highest)
                            highest = fileNum
                    }
                });

                console.log('highest', highest)
                const lastHistoryFile = require(__dirname + '/Data/' + file + '/StreamingHistory' + highest + '.json')
                const endDate = lastHistoryFile[lastHistoryFile.length - 1].endTime.split(' ')[0]
                console.log('endDate', endDate)

                const firstHistoryFile = require(__dirname + '/Data/' + file + '/StreamingHistory' + 0 + '.json')
                const startDate = firstHistoryFile[0].endTime.split(' ')[0]
                console.log('startDate', startDate)


                exportDates[endDate] = {
                    path: __dirname + '/Data/' + file,
                    max: highest,
                    startDate: startDate
                }
                endDates.push(endDate)
            });

        } else {
            //its a file not a folder
        }
    });
});

const stichDates = async () => {
    console.log("Waiting two seconds for thread safety");
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log("Finished waiting");


    endDates.sort(function (a, b) {
        let aArr = a.split('-')
        let bArr = b.split('-')

        let i = 0;
        while (aArr[i] == bArr[i]) {
            i++
        }


        if (aArr[i] != bArr[i])
            return aArr[i] - bArr[i]
    });

    endDates.reverse()

    console.log('endDates', endDates)

    endDates.forEach(endDate => {
        let metaInfo = exportDates[endDate]
        let backCount = metaInfo.max

        while (backCount >= 0) {
            const historyFile = require(metaInfo.path + '/StreamingHistory' + backCount + '.json')

            console.log('History file path', metaInfo.path + '/StreamingHistory' + backCount + '.json')

            historyFile.forEach((song, songI) => {
                let playDate = song.endTime.split(' ')[0]

                const split = playDate.split('-')
                const getYear = () => split[0]
                const getMonth = () => {
                    let rawMonth = split[1]
                    if(rawMonth.startsWith('0'))
                       rawMonth = rawMonth.substr(1)

                    return rawMonth
                }
                const getDay = () => split[2]

                if (!global.years[getYear()]) {
                    //check if year entry does not exist to make one
                    console.log(`Year ${getYear()} did not exist, so it was created`)
                    global.years[getYear()] = {
                        overallListenTime: 0,
                        months: {}
                    }

                    for (let month = 1; month <= 12; month++){
                        global.years[getYear()].months[month] = {
                            history: {},
                            tally: {},
                            artistTally: {},
                            listenTimePerSong: {},
                            overallListenTime: 0,
                        }
                    }


                }

                const idTag = song.trackName + '-' + song.artistName

                let trackIndexNum = 0

                let nameAndArtist = [song.artistName, song.trackName]

                if (!global.revTrackIndexes[idTag]) {
                    //check if track has an existing reference number, if not make one
                    global.revTrackIndexes[idTag] = indexID
                    global.trackIndexes[indexID] = nameAndArtist
                    trackIndexNum = indexID

                    indexID++
                } else {
                    trackIndexNum = global.revTrackIndexes[idTag]
                }

                let artistIndexNum = 0

                if (!global.revArtistIndexes[song.artistName]) {
                    //check if artist has an existing reference number, if not make one
                    global.revArtistIndexes[song.artistName] = indexArtistID
                    global.artistIndexes[indexArtistID] = song.artistName
                    artistIndexNum = indexArtistID

                    indexArtistID++
                } else {
                    artistIndexNum = global.revTrackIndexes[song.artistName]
                }

                if (!global.years[getYear()].months[getMonth()].history[getDay()]){
                    //console.log(`Day ${getDay()} in ${getMonth()} of ${getYear()} did not exist, so it was created`)
                    global.years[getYear()].months[getMonth()].history[getDay()] = []
                }

                global.years[getYear()].months[getMonth()].history[getDay()].push([
                    trackIndexNum,
                    song.msPlayed,
                    song.endTime.split(' ')[1]
                ])

                if (!global.years[getYear()].months[getMonth()].tally[trackIndexNum]) {
                    global.years[getYear()].months[getMonth()].tally[trackIndexNum] = 0
                    global.years[getYear()].months[getMonth()].listenTimePerSong[trackIndexNum] = 0
                }

                if(!global.years[getYear()].months[getMonth()].artistTally[artistIndexNum]){
                    global.years[getYear()].months[getMonth()].artistTally[artistIndexNum] = 0
                }

                if (song.msPlayed >= 10000){ //if the song has been played for less than 10 seconds do not count it as a play
                    global.years[getYear()].months[getMonth()].tally[trackIndexNum]++
                    global.years[getYear()].months[getMonth()].artistTally[artistIndexNum]++
                }

                global.years[getYear()].months[getMonth()].listenTimePerSong[trackIndexNum] += song.msPlayed


                //month overall
                global.years[getYear()].months[getMonth()].overallListenTime += song.msPlayed

                //year overall
                global.years[getYear()].overallListenTime += song.msPlayed

            });
            //console.log(global.years[2021])
            backCount--
        }
        //console.log(global.years[2021].months[10]);

        //sort
        for (let year in global.years) {
            for (let month = 1; month <= 12; month++) {
                // console.log(global.years[year].months[month].tally)
                let arrConvert = []
                for (const [key, value] of Object.entries(global.years[year].months[month].tally)) {
                    arrConvert.push({
                        nameTag: key,
                        count: value
                    })
                }

                //console.log(arrConvert)

                arrConvert.sort((a, b) => (a.count > b.count) ? -1 : (a.count === b.count) ? ((a.nameTag > b.nameTag) ? -1 : 1) : 1)
                //arrange from greatest to least plays

                global.years[year].months[month].tally = arrConvert

            }
        }
    });

    //console.log(global.years[2021].months[0])
    //console.log(global.trackIndexes)
    delete global.revTrackIndexes
    delete global.revArtistIndexes
    //save as file
    try {
        fs.writeFileSync(__dirname + '/master.json', JSON.stringify(global))
        console.log('file saved to: ' + __dirname + '/master.json')
    } catch (err) {
        console.error(err)
    }
}