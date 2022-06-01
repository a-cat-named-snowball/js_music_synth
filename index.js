
// Contains mappings from notes to frequencies
import hz_at_note from "./note_to_hz_mapping.js"


const TAU = Math.PI*2   // Makes math shorter
const MIDDLE_C = 261.63 // Used to make pitch-relative sound effects

const song_joy = parseNotes(`
FC4 FC4 FC4 FC4
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
	let note_id = 0
	for(let i=0;i<notes.length;i++){
		let note = notes[i]
		let duration = parseInt(note[0],16)
		let hz = hz_at_note[note.slice(1)]
		note_id++
		
		// Alternatively, calculate frequency - but a better algorithm is needed.
		// let semitone = note.charCodeAt(1) - "A".charCodeAt(0)
		// let octave = parseInt(note[note.length-1]) - 4
		// let hz = 440 * Math.pow(2,octave + (semitone-8)/12)
		
		let counter = duration
		let offset = 0
		while(--counter>0) {
			output.push({
				hz,
				offset:offset++,
				duration,
				note_id
			})
		}
	}
	return output
}


// This needs to be triggered by a user action
function playAudio(song,bpm){

	const audioCtx = new window.AudioContext();

	const resolution = 16/bpm // Each note is 1/16th in length,
	const frameCount = audioCtx.sampleRate * song.length * resolution
	const framesPerSixteenth = audioCtx.sampleRate * resolution

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
	
	const secondsPerSixteenth = 4/bpm

	let frame_offset = 0
	let last_note = null
	// Loop through each frame and write some sound data to the buffer
  for (let i = 0; i < frameCount; i++) {
		
		// Get the index of the current note and progress through playing it
		let note_index = Math.floor(i/framesPerSixteenth)

		let frames_elapsed = (i-frame_offset)
		let seconds_elapsed = frames_elapsed / audioCtx.sampleRate
		
		let note = song[note_index]
		
		if(last_note === null || last_note.note_id != note.note_id){
			frame_offset = i
		}
		last_note = note


		// Generate a waveform and volume
		let note_duration_seconds = note.duration*secondsPerSixteenth
		

		let normalized_time_elapsed = seconds_elapsed / note_duration_seconds
		let normalized_hz = note.hz * note_duration_seconds

		
		// helicopter_sfx
		// explosion_sfx
		let waveform = explosion_sfx(
			seconds_elapsed * note.hz,
			note.duration * framesPerSixteenth * note.hz / audioCtx.sampleRate
		)
		//let waveform = square_waveform(normalized_time_elapsed,normalized_hz)
		let volume = 1//adsr_profile(note_progress)

		channel_buffer[i] = reduceBitDepth(volume * waveform)

		
	}



	// Pipe the sound to be played
  const source = audioCtx.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(audioCtx.destination);
  source.start();

}

// Waveform generators
function sin_waveform(time){
	return Math.sin(time * Math.PI*2)
}
function square_waveform(time){
	return (time % 1) > 0.5 ? 1 : -1
}
function sawtooth_waveform(time){
	return (time % 1) * 2 - 1
}
function noise_waveform(time){
	return Math.random() * 2 - 1
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



function generate_random_sin(start,end,number){
	let sin_waves = []
	for(let i=0;i<number;i++){
		sin_waves.push(start + Math.random()*(end-start))
	}
	return function(time,max_time){
		let sum = 0
		sin_waves.forEach(hz=>{
			sum += Math.sin(hz*time)
		})
		return sum/sin_waves.length
	}
}

let low_hz_warble = generate_random_sin(1,2,10)

var explosion_sfx = create_waveform({
	waveform:(time,max_time)=>{
		let start = noise_waveform(time)
		let end =  low_hz_warble(time,max_time)
		let percent = time/max_time
		let dropoff = 1 - Math.pow((1-percent),8)
		return ((1-dropoff)*start + dropoff*end) * (1+dropoff*.5)
	},
	hz: 300,
	hz_vel:-100,
	hz_accel:50,
	vol:(time)=> 1,
	attack:0.0,
	decay:10.5,
})


var helicopter_sfx = create_waveform({
	waveform:(time)=>{
		return square_waveform(time)*.5 + low_hz_warble(time)*0.02
	},
	hz: 100,
	hz_vel:0,
	hz_accel:0,
	vol:(time)=> (
		square_waveform(time*16)*.2+.7 + 
		sin_waveform(time + 20*Math.sin(time*2))*0.1 // Some audio variation
		+ noise_waveform() * .05
	),
	attack:0.2,
	decay:0.6,
})

//Take a percent complete and a config object
function create_waveform(config){
	return (time,max_time) => {
		let normalized_time = time/max_time
		let normalized_hz = (time/MIDDLE_C) // C4 is the "middle" note
		let hz = normalized_hz * (
			config.hz +
			config.hz_vel*normalized_time +
			config.hz_accel*normalized_time*normalized_time
		)

		
		//if(Math.random()<0.01) console.log(normalized_time)
		let vol = config.vol(normalized_hz)
		if(normalized_time<config.attack) {
			vol *= (normalized_time/config.attack)
		}
		else if(normalized_time>config.decay) {
			vol *= 1 - (normalized_time-config.decay)/(1-config.decay)
		}

		return config.waveform(hz,max_time) * vol
	}
}

// Audio requires a user trigger to start
let btn = document.createElement("button")
document.body.appendChild(btn)
btn.innerText = "Play"
btn.onclick = ()=>playAudio(song_joy,88)