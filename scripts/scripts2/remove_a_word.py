# remove_word.py

def remove_word_from_file(file_path, word_to_remove):
    try:
        # Read the file
        with open(file_path, "r", encoding="utf-8") as file:
            content = file.read()

        # Replace the target word (case-sensitive)
        updated_content = content.replace(word_to_remove, "")

        # Write back to the same file
        with open(file_path, "w", encoding="utf-8") as file:
            file.write(updated_content)

        print(f'All instances of "{word_to_remove}" have been removed from {file_path}.')

    except FileNotFoundError:
        print(f"Error: The file '{file_path}' was not found.")
    except Exception as e:
        print(f"An error occurred: {e}")


if __name__ == "__main__":
    # Change this to your actual file path
    file_path = "characters.txt"
    remove_word_from_file(file_path, "ropregnant")
