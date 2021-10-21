import Challenge from "./Challenge";

export default interface ChallengeResult {
    chkey: string;
    snapFrequenceInMillis: number;
    snapNumber: number;
    totalTime: number;
    numberOfChallenges: number;
    challenges: Challenge[];
}