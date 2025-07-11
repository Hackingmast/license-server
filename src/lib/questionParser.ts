
import type { Question } from '@/types/question';
import { v4 as uuidv4 } from 'uuid'; // Using uuid for unique IDs

/**
 * Parses text content from a file into an array of Question objects.
 * Expected format per question block:
 * [Question Text (can be multi-line)]
 * 1) [Option 1 Text]
 * 2) [Option 2 Text]
 * ...
 * Answer: [Correct Option Number (e.g., 2)]
 * Explanation: [Explanation Text (can be multi-line)] (Optional)
 * (Separated by one or more empty lines)
 *
 * @param fileContent The string content read from the text file.
 * @returns An array of Question objects. Logs errors for invalid blocks.
 */
export const parseQuestionsFromFileContent = (fileContent: string): Question[] => {
    const questions: Question[] = [];
    const questionBlocks = fileContent.replace(/\r\n/g, '\n').split(/\n\s*\n+/).filter(block => block.trim());

    questionBlocks.forEach((block, index) => {
        const trimmedBlock = block.trim();
        if (!trimmedBlock) return;

        const allLines = trimmedBlock.split('\n');
        const blockNumber = index + 1;

        let questionTextLines: string[] = [];
        const optionsMap = new Map<string, string>(); // Stores option key (e.g., "1", "2") -> option text
        let answerKey: string | null = null; // Stores the key of the correct answer (e.g., "1", "2")
        let explanationLines: string[] = [];
        let currentState: 'question' | 'options' | 'answer' | 'explanation' | 'unknown' = 'unknown';
        let explanationFound = false;

        try {
            for (let i = 0; i < allLines.length; i++) {
                const line = allLines[i];
                const trimmedLine = line.trim();

                if (!trimmedLine) continue;

                const optionMatch = trimmedLine.match(/^(\d+)\)\s*(.*)/); // Match numbered options
                const answerMatch = trimmedLine.match(/^Answer:\s*(\d+)$/i); // Match "Answer: [number]"
                const explanationMatch = trimmedLine.match(/^Explanation:/i);

                if (explanationMatch) {
                    explanationFound = true;
                    currentState = 'explanation';
                    const explanationTextAfterLabel = trimmedLine.substring("Explanation:".length).trim();
                    if (explanationTextAfterLabel) {
                        explanationLines.push(explanationTextAfterLabel);
                    }
                    for (let j = i + 1; j < allLines.length; j++) {
                        explanationLines.push(allLines[j]);
                    }
                    break;
                } else if (answerMatch) {
                    currentState = 'answer';
                    answerKey = answerMatch[1]; // Store the number as a string key
                } else if (optionMatch) {
                    currentState = 'options';
                    const key = optionMatch[1]; // The number (e.g., "1", "2")
                    const text = optionMatch[2].trim();
                    if (text) {
                        optionsMap.set(key, text);
                    } else {
                        console.warn(`Skipping empty option ${key} in block ${blockNumber}`);
                    }
                } else {
                    if (currentState === 'unknown' || currentState === 'question') {
                        currentState = 'question';
                        questionTextLines.push(line);
                    } else if (currentState === 'options' || currentState === 'answer') {
                        console.warn(`Ignoring unexpected line in block ${blockNumber} after options/answer but before Explanation: "${line}"`);
                    }
                }
            }

            const questionText = questionTextLines.join('\n').trim();
            const explanation = explanationFound ? explanationLines.join('\n').trim() : (explanationLines.length > 0 ? explanationLines.join('\n').trim() : null);
            const options = Array.from(optionsMap.values());
            const correctAnswerText = answerKey ? optionsMap.get(answerKey) : null;

            const errors: string[] = [];
            if (!questionText) errors.push("Missing question text.");
            if (optionsMap.size < 2) errors.push("Must have at least two valid options (e.g., 1) Text, 2) Text).");
            if (!answerKey) errors.push("Missing or invalid 'Answer:' line (e.g., Answer: 2). The answer key must be a number corresponding to an option.");
            if (answerKey && !correctAnswerText) errors.push(`The specified 'Answer' key ('${answerKey}') does not correspond to a valid option.`);
            
            if (errors.length > 0) {
                console.error(`Parsing errors in block ${blockNumber}:`, errors);
                console.error("Problematic Block Content:\n---\n" + trimmedBlock + "\n---");
                return; 
            }

            questions.push({
                id: uuidv4(),
                questionText: questionText!,
                options: options,
                correctAnswer: correctAnswerText!,
                explanation: explanation,
            });

        } catch (error) {
             console.error(`Unhandled error processing block ${blockNumber}:`, error);
             console.error("Problematic Block Content:\n---\n" + trimmedBlock + "\n---");
             return;
        }
    });

    if (questions.length === 0 && questionBlocks.length > 0) {
        console.warn("No valid questions could be parsed from the file content. Please check the format (Question, Options (e.g. 1) Text), Answer: (e.g. Answer: 1), Explanation: [optional]) and ensure blocks are separated by blank lines.");
    } else if (questions.length > 0) {
        console.log(`Successfully parsed ${questions.length} questions.`);
    }

    return questions;
};
