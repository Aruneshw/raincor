import torch
import torch.nn as nn
import torch.nn.functional as F

class MethodSelector(nn.Module):
    def __init__(self, methods: list, input_dim: int):
        """
        Level 2: Method Selector inside each expert.
        """
        super().__init__()
        self.methods = methods
        self.num_methods = len(methods)
        
        self.selector_network = nn.Sequential(
            nn.Linear(input_dim, 32),
            nn.ReLU(),
            nn.Linear(32, self.num_methods)
        )
        
    def forward(self, x):
        logits = self.selector_network(x)
        probs = F.softmax(logits, dim=-1)
        return probs
