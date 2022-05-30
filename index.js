
const NOTES = [
	""
]

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


let btn = document.createElement("button")
document.body.appendChild(btn)
btn.innerText = "Play"
btn.onclick = playAudio