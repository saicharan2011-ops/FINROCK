# CreditSense AI — An Autonomous Credit Appraisal Agent

An autonomous reinforcement learning environment tailored for Indian corporate lending appraisal. 

## Overview
The agent must navigate a Partially Observable Markov Decision Process (POMDP) to collect documents (GST, ITR, Bank Statements), investigate risks (Circular trading, litigation), and issue a final credit recommendation.

## Files
- `openenv.yaml`: HuggingFace OpenEnv standard environment specification file mapping out the Discrete(12) Action Space and structured Observation Space.
- `env.py`: Skeleton Python implemention using the `gymnasium` standard library matching the YAML specifications exactly.

## Setup Requirements

Ensure you have the following packages installed if you wish to run the gymnasium environment:
```bash
pip install gymnasium numpy
```
