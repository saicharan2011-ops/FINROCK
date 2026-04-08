mkdir -p creditsense_ai/{env,parsers,research,blockchain,output,ui}

touch creditsense_ai/env/__init__.py creditsense_ai/env/CreditAppraisalEnv.py creditsense_ai/env/reward_logic.py creditsense_ai/env/actions.py
touch creditsense_ai/parsers/__init__.py creditsense_ai/parsers/pdf_base.py creditsense_ai/parsers/gst_parser.py creditsense_ai/parsers/bank_parser.py creditsense_ai/parsers/annual_report_parser.py
touch creditsense_ai/research/__init__.py creditsense_ai/research/research_agent.py creditsense_ai/research/promoter_scorer.py creditsense_ai/research/turbo_quant.py
touch creditsense_ai/blockchain/__init__.py creditsense_ai/blockchain/web3_logger.py creditsense_ai/blockchain/contract_abi.json creditsense_ai/blockchain/CreditAudit.sol
touch creditsense_ai/output/__init__.py creditsense_ai/output/cam_generator.py
touch creditsense_ai/ui/__init__.py creditsense_ai/ui/streamlit_app.py
touch creditsense_ai/state_schema.py creditsense_ai/openenv.yaml creditsense_ai/requirements.txt creditsense_ai/Dockerfile creditsense_ai/README.md creditsense_ai/.env
