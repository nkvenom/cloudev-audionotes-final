class Phrase {
    startTime = ""
    endTime = ""
    words = []
}

function getTimeCode(totalSecs: number): string {
    // Format and return a string that contains the converted number of seconds into SRT format
    const hours = Math.floor(totalSecs / 3600);
    const minutes = Math.floor((totalSecs - (hours * 3600)) / 60);
    const seconds = totalSecs - (hours * 3600) - (minutes * 60);
    const millis = Math.round(totalSecs % 1 * 1000);

    return `${
        hours.toString().padStart(2, '0')}:${
        minutes.toString().padStart(2, '0')}:${
        seconds.toString().padStart(2, '0')},${
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

        // if it is a new phrase, then get the start_time of the first item
        if (newPhrase) {
            if (item["type"] === "pronunciation") {
                phrase.startTime = getTimeCode(parseFloat(item["start_time"]))
            }
            newPhrase = false
        } else {
            // We need to determine if this pronunciation or punctuation here
            // Punctuation doesn't contain timing information, so we'll want
            // to set the end_time to whatever the last word in the phrase is.
            // Since we are reading through each word sequentially, we'll set
            // the end_time if it is a word
            if (item["type"] === "pronunciation") {
                phrase.endTime = getTimeCode(parseFloat(item["end_time"]))
            }
        }
        // in either case, append the word to the phrase...
        phrase.words.push(item["alternatives"][0]["content"])
        wordsCnt += 1

        // now add the phrase to the phrases, generate a new phrase, etc.
        if (wordsCnt === 10 || wordsCnt === items.length) {
            phrases.push(phrase)
            phrase = new Phrase()
            newPhrase = true
            wordsCnt = 0
        }
    }

    return phrases
}

function writeSrt(phrases) : string {
    console.error("===> Writing phrases to disk...")
    let phraseCount = 1
    let result = ""

    for (const phrase of phrases) {

        // write out the phrase number
        result += phraseCount + "\n"
        phraseCount++

        // write out the start and end time
        result += phrase.startTime + " --> " + phrase.endTime + "\n"

        // write out the full phrase.  Use spacing if it is a word, or punctuation without spacing
        let out = getPhraseText(phrase)

        // write out the srt file
        result += out + "\n\n"
    }

    return result
}

function getPhraseText(phrase: Phrase): string {

    let out = ""
    for (const [i, word] of phrase.words.entries()) {
        if (/[a-zA-Z0-9]/.test(word) && i > 0) {
            out += " " + word
        }

        out += word
    }

    return out
}