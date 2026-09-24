import torch
import pytest
from services.ml.moe.router.router import ErrorExpertRouter
from services.ml.moe.experts.expert_bank import ExpertBank
from services.ml.moe.sparse_routing.sparse import sparse_dispatch

@pytest.fixture
def input_dim():
    return 32

@pytest.fixture
def num_experts():
    return 9

@pytest.fixture
def top_k():
    return 2

@pytest.fixture
def batch_size():
    return 4

@pytest.fixture
def num_grids():
    return 100

def test_routing_probability_sum(input_dim, num_experts, top_k, batch_size, num_grids):
    router = ErrorExpertRouter(input_dim, num_experts, top_k)
    x = torch.randn(batch_size, num_grids, input_dim)
    
    routing_probs, top_k_probs, top_k_indices = router(x)
    
    # Check total routing probs sum to 1
    assert torch.allclose(routing_probs.sum(dim=-1), torch.ones(batch_size, num_grids), atol=1e-5)
    
    # Check top_k_probs sum to 1 (normalized)
    assert torch.allclose(top_k_probs.sum(dim=-1), torch.ones(batch_size, num_grids), atol=1e-5)

def test_top_k_selection(input_dim, num_experts, top_k, batch_size, num_grids):
    router = ErrorExpertRouter(input_dim, num_experts, top_k)
    x = torch.randn(batch_size, num_grids, input_dim)
    
    _, top_k_probs, top_k_indices = router(x)
    
    assert top_k_indices.shape == (batch_size, num_grids, top_k)
    assert top_k_probs.shape == (batch_size, num_grids, top_k)
    
    # Ensure indices are within valid range
    assert (top_k_indices >= 0).all()
    assert (top_k_indices < num_experts).all()

def test_sparse_dispatch_batch_inference(input_dim, batch_size, num_grids):
    expert_names = ['Spatial', 'Temporal', 'Distribution']
    methods = ['QM', 'LightGBM']
    
    expert_bank = ExpertBank(expert_names, methods, input_dim)
    
    top_k_indices = torch.randint(0, len(expert_names), (batch_size, num_grids, 2))
    top_k_probs = torch.ones(batch_size, num_grids, 2) / 2.0
    
    x = torch.randn(batch_size, num_grids, input_dim)
    
    out, complexity = sparse_dispatch(x, top_k_indices, top_k_probs, expert_bank)
    
    assert out.shape == (batch_size, num_grids, 1)
    assert 'expert_calls' in complexity
    assert complexity['expert_calls'] > 0

def test_large_grid_inference(input_dim):
    # Test with a large number of grids
    large_num_grids = 10000
    batch_size = 2
    top_k = 2
    expert_names = ['Spatial', 'Temporal', 'Distribution', 'Orographic', 'Coastal']
    methods = ['QM', 'LightGBM', 'EMOS']
    
    router = ErrorExpertRouter(input_dim, len(expert_names), top_k)
    expert_bank = ExpertBank(expert_names, methods, input_dim)
    
    x = torch.randn(batch_size, large_num_grids, input_dim)
    
    _, top_k_probs, top_k_indices = router(x)
    
    out, complexity = sparse_dispatch(x, top_k_indices, top_k_probs, expert_bank)
    
    assert out.shape == (batch_size, large_num_grids, 1)
    assert complexity['expert_calls'] <= batch_size * large_num_grids * top_k

def test_fallback_expert_unavailable():
    # If an expert index is out of bounds or masked, it should be skipped
    expert_names = ['Spatial', 'Temporal']
    methods = ['QM']
    input_dim = 16
    expert_bank = ExpertBank(expert_names, methods, input_dim)
    
    x = torch.randn(1, 10, input_dim)
    # Give an index 5 which doesn't exist in expert_names (len 2)
    top_k_indices = torch.full((1, 10, 2), 5, dtype=torch.long)
    top_k_probs = torch.ones(1, 10, 2) / 2.0
    
    # Sparse dispatch should gracefully produce zeros for missing experts
    out, complexity = sparse_dispatch(x, top_k_indices, top_k_probs, expert_bank)
    
    assert out.shape == (1, 10, 1)
    assert torch.all(out == 0)
    assert complexity['expert_calls'] == 0
