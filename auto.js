// auto.js

document.addEventListener('DOMContentLoaded', function () {
    const switchIds = [
        'switch1', 'switch2', 'switch3', 'switch4',
        'switch5', 'switch6', 'switch7', 'switch8'
    ];
    
    const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
    let isRunning = false; // To track if auto mode is active
    let abortController = null; // To control job cancellation

    async function setSwitchesState(state, switchIds) {
        for (const id of switchIds) {
            const switchElement = document.getElementById(id);
            if (switchElement) {
                switchElement.checked = state;
                switchElement.dispatchEvent(new Event('change'));
            }
            await delay(2); // Small delay to ensure the job is processed
        }
    }

    async function waitForPleasureValue(threshold, increase = true) {
        const getPleasureValue = () => {
            const pleasureValueText = document.getElementById('pleasure-value').textContent;
            return parseFloat(pleasureValueText);
        };

        while (true) {
            const pleasureValue = getPleasureValue();
            if (increase && pleasureValue >= threshold) break;
            if (!increase && pleasureValue <= threshold) break;
            await delay(100); // Check every 100 milliseconds
        }
    }

    async function autoMode(signal) {
        try {
            if (signal.aborted) return; // If signal was already aborted, exit early

            // Open switches 5, 6, 7 until Pleasure value increases from 0 to 10
            await setSwitchesState(true, ['switch5', 'switch6', 'switch7']);
            await waitForPleasureValue(10); // Wait until Pleasure value reaches 10
            await setSwitchesState(false, ['switch5', 'switch6', 'switch7']);
            await delay(100); // 100 milliseconds delay

            // Open switch 4 until Pleasure value increases from 10 to 100
            await setSwitchesState(true, ['switch4']);
            await waitForPleasureValue(100); // Wait until Pleasure value reaches 100
            await setSwitchesState(false, ['switch4']);
            await delay(100); // 100 milliseconds delay

            // Open switch 2
            await setSwitchesState(true, ['switch2']);
            await delay(100); // 100 milliseconds delay

            // Close switch 3
            await setSwitchesState(false, ['switch3']);
            await delay(1000); // 1000 milliseconds delay

            // Open switch 1 for 2 minutes
            await setSwitchesState(true, ['switch1']);
            await delay(120000); // 2 minutes delay
            await setSwitchesState(false, ['switch1']);

            await delay(3000); // 3000 milliseconds delay

            // Close switch 2
            await setSwitchesState(false, ['switch2']);
            await delay(100); // 100 milliseconds delay

            // Open switch 3
            await setSwitchesState(true, ['switch3']);
            await delay(1000); // 1000 milliseconds delay

            // Open switch 1 until Pleasure value decreases from 100 to 0
            await setSwitchesState(true, ['switch1']);
            await waitForPleasureValue(0, false); // Wait until Pleasure value reaches 0

            // Finally close all switches
            await setSwitchesState(false, switchIds);
        } catch (error) {
            if (error.name === 'AbortError') {
                console.log('Job aborted');
            } else {
                console.error('Error in auto mode:', error);
            }
        } finally {
            isRunning = false; // Reset flag when the job finishes
            document.querySelector('.auto-manual-btn').textContent = 'Auto'; // Reset button text to "Auto"
        }
    }

    document.querySelector('.auto-manual-btn').addEventListener('click', function () {
        const button = this;
        
        if (isRunning) {
            // Cancel the running job if the button is clicked while running
            if (abortController) {
                abortController.abort(); // Abort the current job
            }
            setSwitchesState(false, switchIds); // Turn off all switches
            isRunning = false; // Reset running state
            button.textContent = 'Auto'; // Reset button text to "Auto"
            console.log('Auto mode aborted and reset');
        } else {
            // Start a new auto mode job
            abortController = new AbortController(); // Create a new AbortController
            isRunning = true; // Set running state
            autoMode(abortController.signal); // Start auto mode with abort signal
            button.textContent = 'Manual'; // Set button text to "Manual"
        }
    });
});

