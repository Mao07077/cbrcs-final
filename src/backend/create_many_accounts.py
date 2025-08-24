import random
from datetime import datetime, timedelta
from database import users_collection, modules_collection, post_test_collection

def random_birthdate(age):
    today = datetime.today()
    birth_year = today.year - age
    birth_month = random.randint(1, 12)
    birth_day = random.randint(1, 28)
    return f"{birth_year:04d}-{birth_month:02d}-{birth_day:02d}"

def random_survey():
    categories = ["Memory", "Focus", "Time Management", "Motivation", "Stress"]
    habits = ["Review Notes", "Practice Questions", "Group Study", "Flashcards", "Mind Mapping", "Pomodoro"]
    categoryScores = {cat: random.randint(1, 5) for cat in categories}
    top3Habits = random.sample(habits, 3)
    return {
        "categoryScores": categoryScores,
        "top3Habits": top3Habits,
        "surveyCompleted": True
    }

def random_module(modules):
    return random.choice(modules)

def random_posttest_answers(module):
    posttest = post_test_collection.find_one({"module_id": str(module["_id"])})
    answers = {}
    if posttest and "questions" in posttest:
        for q in posttest["questions"]:
            options = q.get("options", [])
            if options:
                answers[q["question"]] = random.choice(options)
    return answers

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

def main():
    names = [
        "Manuel II C. Fernandez",
        "EJ Pineda",
        "Nomher Sajol",
        "King Schleiden M. Amoguis",
        "James N. Estandarte",
        "Shinichi Yoshinaga",
        "Andrea Cielo M. Tacos",
        "Rochelle Ann C. Gamaro",
        "Emmanuel James C. Macuja",
        "Marc Syd S. Pacheco",
        "Michael Anthony M. Pedemonte",
        "Angela M. Agaton",
        "Juliana Precious Y. Salandino",
        "Mary Grace G. Resolme",
        "Angela D. Cordero",
        "Daniel Josh M. Zamora",
        "Zaira Palces",
        "Kathrine Joy S. Reyes",
        "Mary M. Morillo",
        "Aie Mino",
        "Euclid John O. Agustin",
        "Dan Lucky Ivan D. Ansuas",
        "Mark Angelo A. Carcillar",
        "Rhojan M. Jaum",
        "Auri Zerene T. Ramirez",
        "Bacsal M. Mikkanel",
        "Ven Russel A. Ampo",
        "Dwayne Aronn D. Vizarra",
        "Myla Kem T. Mahinay",
        "Mike Anthony M. Oliva"
    ]
    modules = list(modules_collection.find({"program": "LET"}))
    for full_name in names:
        age = random.randint(18, 35)
        birthdate = random_birthdate(age)
        id_number = str(random.randint(100000, 999999))
        password = "password"
        email = "mikemikeeoliva@gmail.com"
        program = "LET"
        role = "student"
        gender = random.choice(["Male", "Female"])
        first, middle, last, suffix = parse_name(full_name)
        survey = random_survey()
        module = random_module(modules) if modules else None
        module_id = str(module["_id"]) if module else None
        posttest_answers = random_posttest_answers(module) if module else {}
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
            "role": role,
            "surveyCompleted": survey["surveyCompleted"],
            "categoryScores": survey["categoryScores"],
            "top3Habits": survey["top3Habits"],
            "answered_module": module_id,
            "posttest_answers": posttest_answers
        }
        users_collection.insert_one(user_doc)
        print(f"Created account for {full_name} (ID: {id_number})")

if __name__ == "__main__":
    main()
