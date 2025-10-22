
import sys

def add_text_to_prompts(filename, text_to_add):
    """
    Reads a file, adds specified text to lines starting with "prompt",
    and writes the modified content back to the file.
    """
    try:
        with open(filename, 'r') as f:
            lines = f.readlines()

        modified_lines = []
        for line in lines:
            if line.strip().startswith("prompt"):
                modified_lines.append(line.strip() + " "+ text_to_add + "\n")
            else:
                modified_lines.append(line)

        with open(filename, 'w') as f:
            f.writelines(modified_lines)

        print(f"Successfully modified file: {filename}")

    except FileNotFoundError:
        print(f"Error: File not found at {filename}")
    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python add_text.py <text_to_add>")
    else:
        text_to_add = sys.argv[1]
        add_text_to_prompts("characters.txt", text_to_add)

