module aether_reputation::reputation {
    use sui::event;
    use sui::object::{Self, UID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};

    public struct AgentReputation has key, store {
        id: UID,
        agent: address,
        score: u64,
        completed_tasks: u64,
        validations: u64,
    }

    public struct ReputationUpdated has copy, drop {
        reputation_id: address,
        agent: address,
        score: u64,
        completed_tasks: u64,
    }

    public entry fun create_reputation(agent: address, ctx: &mut TxContext) {
        let reputation = AgentReputation {
            id: object::new(ctx),
            agent,
            score: 100,
            completed_tasks: 0,
            validations: 0,
        };

        transfer::transfer(reputation, tx_context::sender(ctx));
    }

    public entry fun record_completion(reputation: &mut AgentReputation, quality_score: u64) {
        reputation.completed_tasks = reputation.completed_tasks + 1;
        reputation.score = reputation.score + quality_score;

        event::emit(ReputationUpdated {
            reputation_id: object::uid_to_address(&reputation.id),
            agent: reputation.agent,
            score: reputation.score,
            completed_tasks: reputation.completed_tasks,
        });
    }

    public entry fun record_validation(reputation: &mut AgentReputation, quality_score: u64) {
        reputation.validations = reputation.validations + 1;
        reputation.score = reputation.score + quality_score;

        event::emit(ReputationUpdated {
            reputation_id: object::uid_to_address(&reputation.id),
            agent: reputation.agent,
            score: reputation.score,
            completed_tasks: reputation.completed_tasks,
        });
    }
}
