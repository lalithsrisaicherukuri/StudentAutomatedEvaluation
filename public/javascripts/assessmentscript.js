document.addEventListener('DOMContentLoaded', function () {
    const selectElement = document.getElementById('select');
    const topics = document.querySelectorAll('.topic > div');
    const outputElement = document.getElementById('output');

    function hideAllTopics() {
        topics.forEach(topic => topic.style.display = 'none');
    }

    hideAllTopics();
    document.getElementById('story').style.display = 'block';

    selectElement.addEventListener('change', function () {
        hideAllTopics();
        const selectedOption = selectElement.value;
        const selectedTopic = document.getElementById(selectedOption);
        if (selectedTopic) {
            selectedTopic.style.display = 'block';
        }
    });

    let isRecording = false;

    async function startSpeech() {
        if (isRecording) return;
        isRecording = true;

        // Get the original text from the selected topic
        const selectedOption = selectElement.value;
        const originalText = document.getElementById(selectedOption).innerText.trim();

        // Fetch speech-to-text result
        const response = await fetch('/start-speech');
        const data = await response.json();
        const recognizedText = data.recognized_text;

        outputElement.innerText = recognizedText;

        const compareResponse = await fetch('/compare-text', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ original: originalText, spoken: recognizedText })
        });

        const compareData = await compareResponse.json();
        outputElement.innerText += `\nSimilarity Score: ${compareData.similarity}%`;

        // Convert similarity score to a number
        const similarityValue = parseFloat(compareData.similarity);

        // Send the similarity score to the server to update the student's grade
        // window.studentId should have been set in your assessment.ejs file.
        const updateResponse = await fetch(`/assessment/${window.studentId}/submit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ similarity: similarityValue })
        });

        const updateData = await updateResponse.json();
        alert("Grade updated. New Grade: " + updateData.newGrade);
    }

    function stopSpeech() {
        isRecording = false;
        fetch('/stop-speech');
        outputElement.innerText += ' [Stopped]';
    }

    document.getElementById('startSpeech').addEventListener('click', startSpeech);
    document.getElementById('stopSpeech').addEventListener('click', stopSpeech);
});
