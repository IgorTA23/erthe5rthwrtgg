/**
 * RECOMMENDATION CARD — single clean suggestion, MVIS compliant.
 * Shown at top of Distribution Preview when confidence ≥ 0.50.
 */
import React, { useState } from 'react';
import { Lightbulb, X, AlertTriangle } from 'lucide-react';

const TRANSFORM_LABELS = {
  none: 'None',
  log10: 'Log₁₀',
  log2: 'Log₂',
  sqrt: 'Square Root',
  cbrt: 'Cube Root',
  vst: 'VST',
};

const SCALE_LABELS = {
  none: 'None',
  mean: 'Mean centering',
  auto: 'Z-score',
  pareto: 'Pareto',
  range: 'Range scaling',
};

export default function RecommendationCard({ recommendation, onApply }) {
  const [dismissed, setDismissed] = useState(false);

  if (!recommendation || dismissed) return null;

  const {
    suggested_transformation,
    suggested_scaling,
    confidence,
    reason,
    warnings
  } = recommendation;

  const transformLabel =
    TRANSFORM_LABELS[suggested_transformation] || suggested_transformation;

  const scaleLabel =
    SCALE_LABELS[suggested_scaling] || suggested_scaling;

  const confPct = Math.round(confidence * 100);

  const confidenceColor =
    confidence >= 0.90
      ? '#10b981'
      : confidence >= 0.70
      ? '#4C72B0'
      : '#f59e0b';

  return (
    <div
      style={{
        background: '#f0f7ff',
        border: '1px solid #bfdbfe',
        borderRadius: 10,
        padding: '12px 14px',
        marginBottom: 12,
        fontFamily: 'Arial, Helvetica, sans-serif',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 6,
        }}
      >
        <Lightbulb
          style={{
            width: 14,
            height: 14,
            color: '#3b82f6',
            flexShrink: 0,
          }}
        />

        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: '#1e40af',
          }}
        >
          Suggested preprocessing
        </span>

        <span
          style={{
            marginLeft: 'auto',
            fontSize: 10,
            fontWeight: 600,
            color: confidenceColor,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {confPct}% confidence
        </span>

        <button
          onClick={() => setDismissed(true)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
            display: 'flex',
            color: '#93c5fd',
          }}
          title="Dismiss"
        >
          <X style={{ width: 12, height: 12 }} />
        </button>
      </div>

      {/* Suggestion */}
      <p
        style={{
          fontSize: 12,
          fontWeight: 600,
 
