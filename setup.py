import os
import shutil
from pathlib import Path

root_dir = Path("creditsense_ai")
root_dir.mkdir(exist_ok=True)

folders_files = {
    "env": ["__init__.py", "CreditAppraisalEnv.py", "reward_logic.py", "actions.py"],
    "parsers": ["__init__.py", "pdf_base.py", "gst_parser.py", "bank_parser.py", "annual_report_parser.py"],
    "research": ["__init__.py", "research_agent.py", "promoter_scorer.py", "turbo_quant.py"],
    "blockchain": ["__init__.py", "web3_logger.py", "contract_abi.json", "CreditAudit.sol"],
    "output": ["__init__.py", "cam_generator.py"],
    "ui": ["__init__.py", "streamlit_app.py"]
}

root_files = ["state_schema.py", "openenv.yaml", "requirements.txt", "Dockerfile", "README.md", ".env"]

for folder, files in folders_files.items():
    folder_path = root_dir / folder
    folder_path.mkdir(exist_ok=True)
    for file in files:
        file_path = folder_path / file
        file_path.touch()

for file in root_files:
    file_path = root_dir / file
    file_path.touch()

for file_name in ["state_schema.py", "openenv.yaml", "README.md"]:
    src = Path(file_name)
    if src.exists():
        shutil.move(str(src), str(root_dir / file_name))

env_src = Path("env.py")
if env_src.exists():
    shutil.move(str(env_src), str(root_dir / "env" / "CreditAppraisalEnv.py"))
