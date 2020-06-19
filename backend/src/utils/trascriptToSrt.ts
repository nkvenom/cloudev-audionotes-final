class Phrase {
    startTime = ""
    endTime = ""
    words = []
}

/**
 * 
 * @param durationSecs a duration in secs
 * @returns {string} an SRT compatible string to compose a file, not really that compartible
 * because SRT uses comma for millis because the author was French
 */
function getTimeCode(durationSecs: number): string {
    // Format and return a string that contains the converted number of seconds into SRT format
    const hours = Math.floor(durationSecs / 3600);
    const minutes = Math.floor((durationSecs - (hours * 3600)) / 60);
    const seconds = durationSecs - (hours * 3600) - (minutes * 60);
    const millis = Math.round(durationSecs % 1 * 1000);

    return `${
        hours.toString().padStart(2, '0')}:${
        minutes.toString().padStart(2, '0')}:${
        seconds.toString().padStart(2, '0')}.${
        millis.toString().padStart(3, '0')}`
}

export function getPhrasesFromTranscript(transcript: any): Phrase[] {
    const items = transcript["results"]["items"]

    // set up some variables for the first pass
    const phrases: Phrase[] = []
    let wordsCnt = 0
    let phrase = new Phrase()
    let newPhrase = true

    console.error("===> Creating phrases from transcript...")

    for (const item of items) {

        const type = item["type"]
        const token = item["alternatives"][0]["content"]

        if (newPhrase && type !== "pronunciation") {
            continue;
        }

        // if it is a new phrase, then get the start_time of the first item
        if (newPhrase) {
            phrase.startTime = getTimeCode(parseFloat(item["start_time"]))
            newPhrase = false
        } else {
            // We need to determine if this pronunciation or punctuation here
            // Punctuation doesn't contain timing information, so we'll want
            // to set the end_time to whatever the last word in the phrase is.
            // Since we are reading through each word sequentially, we'll set
            // the end_time if it is a word
            if (type === "pronunciation") {
                phrase.endTime = getTimeCode(parseFloat(item["end_time"]))
            }
        }

        if (type === "pronunciation") {
            phrase.words.push(token)
        } else if (type !== "pronunciation" && phrase.words.length > 0) {
            phrase.words.push(token)
        }

        if (type === "pronunciation") {
            wordsCnt++
        }

        if (wordsCnt === 10) {
            phrases.push(phrase)
            phrase = new Phrase()
            newPhrase = true
            wordsCnt = 0
        }
    }

    // Workaround for little phrases
    if (wordsCnt > 0) {
        phrases.push(phrase)
    }

    return phrases
}

export function getRawJsonFromTranscript(transcript: any): any[] {
    const phrases = getPhrasesFromTranscript(transcript)
    const subsRaw = []
    for (const ph of phrases) {
        const { startTime, endTime, words } = ph

        let text = words[0] || '';
        for (const token of words.slice(1)) {
            if (/^\w+$/.test(token) || token.length > 1) {
                text += ' ' + token;
            } else {
                text += token;
            }
        }

        const raw = { startTime, endTime, text };
        subsRaw.push(raw)
    }

    return subsRaw
}