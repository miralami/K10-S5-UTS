<?php
// GENERATED CODE -- DO NOT EDIT!

namespace Ai;

/**
 * AI Analysis Service
 */
class AIAnalysisServiceClient extends \Grpc\BaseStub {

    /**
     * @param string $hostname hostname
     * @param array $opts channel options
     * @param \Grpc\Channel $channel (optional) re-use channel object
     */
    public function __construct($hostname, $opts, $channel = null) {
        parent::__construct($hostname, $opts, $channel);
    }

    /**
     * Analyze daily journal notes
     * @param \Ai\DailyAnalysisRequest $argument input argument
     * @param array $metadata metadata
     * @param array $options call options
     * @return \Grpc\UnaryCall
     */
    public function AnalyzeDaily(\Ai\DailyAnalysisRequest $argument,
      $metadata = [], $options = []) {
        return $this->_simpleRequest('/ai.AIAnalysisService/AnalyzeDaily',
        $argument,
        ['\Ai\AnalysisResult', 'decode'],
        $metadata, $options);
    }

    /**
     * Analyze weekly journal from daily summaries
     * @param \Ai\WeeklyAnalysisRequest $argument input argument
     * @param array $metadata metadata
     * @param array $options call options
     * @return \Grpc\UnaryCall
     */
    public function AnalyzeWeekly(\Ai\WeeklyAnalysisRequest $argument,
      $metadata = [], $options = []) {
        return $this->_simpleRequest('/ai.AIAnalysisService/AnalyzeWeekly',
        $argument,
        ['\Ai\AnalysisResult', 'decode'],
        $metadata, $options);
    }

    /**
     * Analyze writing style and find author doppelgänger
     * @param \Ai\WritingStyleRequest $argument input argument
     * @param array $metadata metadata
     * @param array $options call options
     * @return \Grpc\UnaryCall
     */
    public function AnalyzeWritingStyle(\Ai\WritingStyleRequest $argument,
      $metadata = [], $options = []) {
        return $this->_simpleRequest('/ai.AIAnalysisService/AnalyzeWritingStyle',
        $argument,
        ['\Ai\WritingStyleResult', 'decode'],
        $metadata, $options);
    }

    /**
     * Get movie recommendations based on mood
     * @param \Ai\MovieRecommendationRequest $argument input argument
     * @param array $metadata metadata
     * @param array $options call options
     * @return \Grpc\UnaryCall
     */
    public function GetMovieRecommendations(\Ai\MovieRecommendationRequest $argument,
      $metadata = [], $options = []) {
        return $this->_simpleRequest('/ai.AIAnalysisService/GetMovieRecommendations',
        $argument,
        ['\Ai\MovieRecommendationResult', 'decode'],
        $metadata, $options);
    }

}
