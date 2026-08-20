import json
import subprocess
import sys
import os
import tempfile
from pathlib import Path

MODEL_SCRIPT = Path(__file__).parent / "model_template.py"


def run_solve_sync(params: dict, timeout_seconds: int = 300) -> dict:
    with tempfile.TemporaryDirectory() as tmp:
        params_path = os.path.join(tmp, "params.json")
        results_path = os.path.join(tmp, "results.json")
        with open(params_path, "w") as f:
            json.dump(params, f)

        env = os.environ.copy()
        env["PYTHONIOENCODING"] = "utf-8"

        try:
            subprocess.run(
                [sys.executable, str(MODEL_SCRIPT), params_path, results_path],
                timeout=timeout_seconds,
                check=True,
                capture_output=True,
                text=True,
                env=env,
            )
        except subprocess.TimeoutExpired:
            return {"status": "failed", "error_message": f"Solve exceeded {timeout_seconds}s time limit"}
        except subprocess.CalledProcessError as e:
            return {"status": "failed", "error_message": e.stderr or str(e)}

        with open(results_path) as f:
            return json.load(f)