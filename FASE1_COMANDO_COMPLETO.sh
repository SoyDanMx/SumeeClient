#!/bin/bash
# Comando para crear Hugging Face Inference Endpoint
# Token: configurar HF_TOKEN en el entorno (no commitear)

curl https://api.endpoints.huggingface.cloud/v2/endpoint/daninuno \
  -X POST \
  -d '{
    "cacheHttpResponses": false,
    "compute": {
      "accelerator": "cpu",
      "instanceSize": "x1",
      "instanceType": "intel-spr",
      "scaling": {
        "maxReplica": 1,
        "measure": {
          "hardwareUsage": 80
        },
        "metric": "hardwareUsage",
        "minReplica": 0,
        "scaleToZeroTimeout": 60
      }
    },
    "model": {
      "env": {},
      "framework": "pytorch",
      "image": {
        "tei": {
          "healthRoute": "/health",
          "maxBatchTokens": 16384,
          "maxConcurrentRequests": 512,
          "url": "ghcr.io/huggingface/text-embeddings-inference:cpu-1.8.3"
        }
      },
      "repository": "sentence-transformers/all-MiniLM-L6-v2",
      "secrets": {},
      "task": "sentence-embeddings",
      "fromCatalog": true
    },
    "name": "all-minilm-l6-v2-fpe",
    "provider": {
      "region": "us-east-1",
      "vendor": "aws"
    },
    "tags": [],
    "type": "private"
  }' \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${HF_TOKEN:?set HF_TOKEN}"

