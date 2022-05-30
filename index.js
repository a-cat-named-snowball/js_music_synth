
// Contains mappings from notes to frequencies
import hz_at_note from "./note_to_hz_mapping.js"

const NOTES = `E4 E4 F4 G4 G4 F4 E4 D4`.split(" ")

function playAudio(){
	const audioCtx = new window.AudioContext();
	audioCtx.sampleRate = 16000;


	const frameCount = audioCtx.sampleRate * 10.0;

	const channels = 1
	const audioBuffer = audioCtx.createBuffer(
		channels,
		frameCount,
		audioCtx.sampleRate
	);

	let channel_buffer = audioBuffer.getChannelData(0)

   for (var i = 0; i < frameCount; i++) {
		channel_buffer[i] = Math.random() * 2 - 1;
   }


	// Get an AudioBufferSourceNode.
  // This is the AudioNode to use when we want to play an AudioBuffer
  var source = audioCtx.createBufferSource();
  // set the buffer in the AudioBufferSourceNode
  source.buffer = audioBuffer;
  // connect the AudioBufferSourceNode to the
  // destination so we can hear the sound
  source.connect(audioCtx.destination);
  // start the source playing
  source.start();


}

console.log(hz_at_note["C4"])


let btn = document.createElement("button")
document.body.appendChild(btn)
btn.innerText = "Play"
btn.onclick = playAudio