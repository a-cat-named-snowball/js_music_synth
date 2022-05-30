
// Contains mappings from notes to frequencies
import hz_at_note from "./note_to_hz_mapping.js"


const NOTES = parseNotes(`
4E4 4E4 4F4 4G4
4G4 4F4 4E4 4D4
4C4 4C4 4D4 4E4
6E4 2D4 8D4
`)

// Convert note format into more easily used data
function parseNotes(notes) {
	let notes = notes.replaceAll("\n"," ")
		.split(" ")
		.filter(n=>n)
		.map(n=>n.trim())
	
	let output = []
	for(let i=0;i<notes.length;i++){
		let duration = note[0].parseInt(16)
		let semitone = note.charCodeAt(1) - "A".charCodeAt(0)
		let octave = parseInt(note[note.length-1]) - 4
		let hz = hz_at_note[note]

		while(duration-->0) {
			output.push({hz,end:duration===1})
		}
	}
}

// Only works with valid notes in the form [A-G][b|#]?\d
function note_to_hz(note){

	// Return precalculated note for now since it sounds better
	return hz_at_note[note]

	let semitone = note.charCodeAt(0) - "A".charCodeAt(0)
	
	let octave = parseInt(note[note.length-1]) - 4

	if(note[1]==="b") semitone--
	else if(note[1]==="b") semitone++

	return 440 * Math.pow(2,octave + semitone/12)
}
function note_duration(note){
	return note
}

// This needs to be triggered by a user action
function playAudio(){


	const audioCtx = new window.AudioContext();
	//audioCtx.sampleRate = 16000;


	// Fixed length song at 4 seconds right now
	// TODO: Set based on BPM and song length
	const frameCount = audioCtx.sampleRate * 4.0;

	// Create the buffer, only 1 channel (mono), with set length and sample rate
	const channels = 1
	const audioBuffer = audioCtx.createBuffer(
		channels,
		frameCount,
		audioCtx.sampleRate
	);

	// Get a buffer for a channel. In this case there's only one channel
	// But for sterio you would have to work with two of these, one for each side
	let channel_buffer = audioBuffer.getChannelData(0)

	// Loop through each frame and write some sound data to the buffer
  for (var i = 0; i < frameCount; i++) {

		let time = i / audioCtx.sampleRate

		// Get the index of the current note and progress through playing it
		let note_index = Math.floor(NOTES.length * (i/frameCount))
		let note = NOTES[note_index]
		let note_progress = (NOTES.length * (i/frameCount)) % 1
		let hz = note_to_hz(note)
		

		// Generate a waveform and volume
		let waveform = sawtooth_waveform(time,hz)
		let volume = adsr_profile(note_progress)

		channel_buffer[i] = reduceBitDepth(volume * waveform)
	}



	// Pipe the sound to be played
  var source = audioCtx.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(audioCtx.destination);
  source.start();

}

// Waveform generators
function sin_waveform(time,hz){
	return Math.sin(time * hz * Math.PI*2)
}
function square_waveform(time,hz){
	return (time * hz % 1) > 0.5 ? 1 : -1
}
function sawtooth_waveform(time,hz){
	return (time * hz % 1) * 2 - 1
}

// Simple sound profile to remove poping, slowly fades each note in and out
function adsr_profile(i){
	return i<0.1 ? i*10 : (1-(i+.1))
}

// Reduces the depth of the sound to 8 bits.
// I can't personally tell the difference, so it may not work.
function reduceBitDepth(v){
	return Math.round(v*128) / 128
}



// Audio requires a user trigger to start
let btn = document.createElement("button")
document.body.appendChild(btn)
btn.innerText = "Play"
btn.onclick = playAudio