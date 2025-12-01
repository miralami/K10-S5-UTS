"""
Script to generate Python gRPC code from proto files.
Run this after modifying ai.proto.
"""

import subprocess
import sys
import os

def main():
    # Get the directory of this script
    script_dir = os.path.dirname(os.path.abspath(__file__))
    proto_dir = os.path.join(script_dir, '..', 'shared', 'proto')
    proto_file = os.path.join(proto_dir, 'ai.proto')

    if not os.path.exists(proto_file):
        print(f"Error: Proto file not found at {proto_file}")
        sys.exit(1)

    # Generate Python code
    cmd = [
        sys.executable, '-m', 'grpc_tools.protoc',
        f'-I{proto_dir}',
        f'--python_out={script_dir}',
        f'--grpc_python_out={script_dir}',
        proto_file
    ]

    print(f"Running: {' '.join(cmd)}")
    result = subprocess.run(cmd, capture_output=True, text=True)

    if result.returncode != 0:
        print(f"Error generating code:\n{result.stderr}")
        sys.exit(1)

    print("Successfully generated ai_pb2.py and ai_pb2_grpc.py")

    # Fix import in grpc file (Python 3.x compatibility)
    grpc_file = os.path.join(script_dir, 'ai_pb2_grpc.py')
    if os.path.exists(grpc_file):
        with open(grpc_file, 'r') as f:
            content = f.read()
        
        # Ensure absolute import (not relative) for standalone script execution
        content = content.replace('from . import ai_pb2 as ai__pb2', 'import ai_pb2 as ai__pb2')
        
        with open(grpc_file, 'w') as f:
            f.write(content)
        
        print("Fixed imports in ai_pb2_grpc.py")


if __name__ == '__main__':
    main()
