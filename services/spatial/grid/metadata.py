import os
import json
from .engine import SpatialGrid

def generate_and_save_metadata(output_dir: str):
    """
    Generates the canonical 135x129 grid metadata and saves it to a JSON file.
    """
    grid = SpatialGrid()
    metadata = grid.get_metadata()
    
    os.makedirs(output_dir, exist_ok=True)
    output_path = os.path.join(output_dir, "india_0_25_base.json")
    
    # We use model_dump_json for Pydantic v2
    with open(output_path, "w") as f:
        f.write(metadata.model_dump_json(indent=2))
        
    print(f"Successfully generated grid metadata at: {output_path}")
    print(f"Total cells: {metadata.total_cells}")

if __name__ == "__main__":
    # Pointing to the root data/grids directory
    target_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../data/grids"))
    generate_and_save_metadata(target_dir)
