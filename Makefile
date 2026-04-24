#!make
include .env

ADMIN=0x200f3eed8995472ad495ef8c1cfe74cc2eff7414

deploy-agent-id:
	ADMIN=$(ADMIN) forge script scripts/AgentID.s.sol \
		--account deployer \
		--broadcast \
		--rpc-url=${RPC_URL} \
		--priority-gas-price 2000000000 \
		--with-gas-price 4gwei \
		--disable-code-size-limit \
		--gas-estimate-multiplier 150 \
		--optimize \
		--via-ir \
		--optimizer-runs 200 \
		-vvvv
