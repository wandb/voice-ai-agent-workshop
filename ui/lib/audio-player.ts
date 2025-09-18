/**
 * Audio Player Worklet
 */

export async function startAudioPlayerWorklet(): Promise<[AudioWorkletNode, AudioContext]> {
    // 1. Create an AudioContext
    const audioContext = new AudioContext({
        sampleRate: 24000
    });
    
    
    // 2. Load your custom processor code
    await audioContext.audioWorklet.addModule('/pcm-player-processor.js');
    
    // 3. Create an AudioWorkletNode   
    const audioPlayerNode = new AudioWorkletNode(audioContext, 'pcm-player-processor');

    // 4. Connect to the destination
    audioPlayerNode.connect(audioContext.destination);

    // The audioPlayerNode.port is how we send messages (audio data) to the processor
    return [audioPlayerNode, audioContext];
}