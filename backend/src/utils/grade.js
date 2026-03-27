export function scoreToGrade(percentage) {
  if (percentage >= 90) return "A+";
  if (percentage >= 80) return "A";
  if (percentage >= 70) return "B+";
  if (percentage >= 60) return "B";
  if (percentage >= 50) return "C";
  if (percentage >= 40) return "D";
  return "F";
}

export function gradeToPoints(grade) {
  const map = {
    "A+": 10,
    A: 9,
    "B+": 8,
    B: 7,
    C: 6,
    D: 5,
    F: 0,
  };

  return map[grade] ?? 0;
}
