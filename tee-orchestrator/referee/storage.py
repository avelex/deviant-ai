import os
import shutil
import logging

logger = logging.getLogger(__name__)


def setup_agent_scripts():
    logger.info("Setting up agent scripts...")

    os.makedirs("/shared_agent1", exist_ok=True)
    os.makedirs("/shared_agent2", exist_ok=True)

    scripts_dir = "/shared/scripts"

    def process_agent(agent_id, dest_dir):
        script_file = os.path.join(scripts_dir, f"{agent_id}.py")
        dest_file = os.path.join(dest_dir, "agent.py")

        if os.path.exists(script_file):
            logger.info(f"Found script for {agent_id}")
            shutil.copy2(script_file, dest_file)
        else:
            logger.error(f"No script found for {agent_id}. Exiting")
            raise Exception(f"No script found for {agent_id}")

    process_agent("agent1", "/shared_agent1")
    process_agent("agent2", "/shared_agent2")

    logger.info("Agent scripts mounted to shared volumes")


if __name__ == "__main__":
    setup_agent_scripts()
