
// Contains mappings from notes to frequencies
import hz_at_note from "./note_to_hz_mapping.js"


const song_joy = parseNotes(`
4E4 4E4 4F4 4G4
4G4 4F4 4E4 4D4
4C4 4C4 4D4 4E4
6E4 2D4 8D4
`)

// Convert note format into more easily used data
function parseNotes(notes) {
	notes = notes.replaceAll("\n"," ")
		.split(" ")
		.filter(n=>n)
		.map(n=>n.trim())
	
	let output = []
	for(let i=0;i<notes.length;i++){
		let note = notes[i]
		let duration = parseInt(note[0],16)
		let hz = hz_at_note[note.slice(1)]
		
		// Alternatively, calculate frequency - but a better algorithm is needed.
		// let semitone = note.charCodeAt(1) - "A".charCodeAt(0)
		// let octave = parseInt(note[note.length-1]) - 4
		// let hz = 440 * Math.pow(2,octave + (semitone-8)/12)
		
		let counter = duration
		let offset = 0
		while(--counter>0) {
			output.push({hz,offset:offset++,duration})
		}
	}
	return output
}


// This needs to be triggered by a user action
function playAudio(song,bpm){
	console.log(song)

	const audioCtx = new window.AudioContext();

	const resolution = 16 // Each note is 1/16th in length
	const frameCount = audioCtx.sampleRate * song.length * (resolution / bpm);
	const framesPerSixteenth = frameCount / song.length

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
  for (let i = 0; i < frameCount; i++) {
		
		// Get the index of the current note and progress through playing it
		let note_index = Math.floor(i/framesPerSixteenth)
		let note = song[note_index]
		let note_progress = ((i/framesPerSixteenth)%1 + note.offset) / note.duration
		
		
		// Generate a waveform and volume
		let time_elapsed = i / audioCtx.sampleRate
		let waveform = sawtooth_waveform(time_elapsed,note.hz)
		let volume = adsr_profile(note_progress)

		channel_buffer[i] = reduceBitDepth(volume * waveform)
	}



	// Pipe the sound to be played
  const source = audioCtx.createBufferSource();
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

// Simple sound profile to reduce poping, slowly fades each note in and out
// Inputs should be in the range from 0 to 1.
function adsr_profile(i){
	return i<0.125 ? i*8 : (1-(i+.125))
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
btn.onclick = ()=>playAudio(song_joy,88)