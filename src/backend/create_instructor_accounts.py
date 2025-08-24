import random
from datetime import datetime
from database import users_collection

def parse_name(full_name):
    parts = full_name.split()
    if len(parts) == 2:
        return parts[0], "", parts[1], ""
    elif len(parts) == 3:
        return parts[0], "", parts[1], parts[2]
    elif len(parts) == 4:
        return parts[0], parts[1], parts[2], parts[3]
    else:
        first = parts[0]
        middle = parts[1] if len(parts) > 2 else ""
        last = parts[-2] if len(parts) > 2 else parts[-1]
        suffix = parts[-1] if len(parts) > 3 else ""
        return first, middle, last, suffix

def random_birthdate(age):
    today = datetime.today()
    birth_year = today.year - age
    birth_month = random.randint(1, 12)
    birth_day = random.randint(1, 28)
    return f"{birth_year:04d}-{birth_month:02d}-{birth_day:02d}"

def main():
    names = [
        "Cristy Ramboyong",
        "Aubrey Gem A. Reconquista",
        "rd flores",
        "James Gangat",
        "Ronald Allen V. Ondevilla",
        "Micha Gutierrez",
        "Exequiel D. Asuque III",
        "Zacreal S. Lee",
        "Jin McKenzie L. Ford",
        "Mark Christian Coso",
        "Mike Anthony Oliva"
    ]
    for full_name in names:
        age = random.randint(28, 60)
        birthdate = random_birthdate(age)
        id_number = str(random.randint(100000, 999999))
        password = "password"
        email = "mikemikeeoliva@gmail.com"
        program = "LET"
        role = "instructor"
        gender = random.choice(["Male", "Female"])
        first, middle, last, suffix = parse_name(full_name)
        user_doc = {
            "firstname": first,
            "middlename": middle,
            "lastname": last,
            "suffix": suffix,
            "birthdate": birthdate,
            "gender": gender,
            "email": email,
            "password": password,
            "program": program,
            "id_number": id_number,
            "role": role
        }
        users_collection.insert_one(user_doc)
        print(f"Created instructor account for {full_name} (ID: {id_number})")

if __name__ == "__main__":
    main()
