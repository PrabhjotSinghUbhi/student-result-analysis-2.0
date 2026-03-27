import argparse
import datetime as dt
import os
import re
from pathlib import Path

import numpy as np
import pandas as pd
import pdfplumber

try:
    from rapidocr_onnxruntime import RapidOCR
except Exception:
    RapidOCR = None

GRADE_POINTS = {
    "A+": 10,
    "A": 9,
    "B+": 8,
    "B": 7,
    "C+": 6,
    "C": 5,
    "D": 4,
    "E": 0,
    "F": 0,
    "I": 0,
}

# Keep longer grade tokens first.
GRADE_REGEX = r"(A\+|B\+|C\+|A|B|C|D|E|F|I)"


def extract_student_info(text: str):
    uid = re.search(r"UID\s*([A-Z0-9]+)", text)
    name = re.search(r"Name\s*(.+)", text)
    return (
        uid.group(1) if uid else None,
        name.group(1).strip() if name else None,
    )


def extract_subjects(text: str) -> pd.DataFrame:
    lines = [line.strip() for line in text.split("\n") if line.strip()]
    subjects = []
    i = 0

    while i < len(lines):
        line = lines[i]

        full = re.search(
            rf"([A-Z0-9\-]+)\s+(.+?)\s+([\d\.]+)\s+([\d\.]+)\s+([\d\.]+)\s+{GRADE_REGEX}",
            line,
        )
        if full:
            subjects.append(
                [
                    full.group(1),
                    full.group(2),
                    full.group(3),
                    full.group(4),
                    full.group(5),
                    full.group(6),
                ]
            )
            i += 1
            continue

        if re.match(r"^\d{2}[A-Z]{3,4}-$", line):
            try:
                line2 = lines[i + 1]
                line3 = lines[i + 2]
                subject_code = line + line3

                match_full = re.search(
                    rf"(.+?)\s+([\d\.]+)\s+([\d\.]+)\s+([\d\.]+)\s+{GRADE_REGEX}",
                    line2,
                )
                match_simple = re.search(
                    rf"(.+?)\s+([\d\.]+)\s+([\d\.]+)\s+{GRADE_REGEX}",
                    line2,
                )

                if match_full:
                    subjects.append(
                        [
                            subject_code,
                            match_full.group(1),
                            match_full.group(2),
                            match_full.group(3),
                            match_full.group(4),
                            match_full.group(5),
                        ]
                    )
                elif match_simple:
                    subjects.append(
                        [
                            subject_code,
                            match_simple.group(1),
                            None,
                            match_simple.group(2),
                            match_simple.group(3),
                            match_simple.group(4),
                        ]
                    )

                i += 3
                continue
            except Exception:
                pass

        if "Internship" in line:
            try:
                combined = line + " " + lines[i + 1] + " " + lines[i + 2]
                match = re.search(
                    rf"([A-Z0-9\-]+)\s+([\d\.]+)\s+{GRADE_REGEX}",
                    combined,
                )
                if match:
                    subjects.append(
                        [
                            match.group(1),
                            "Social Internship",
                            None,
                            None,
                            match.group(2),
                            match.group(3),
                        ]
                    )

                i += 3
                continue
            except Exception:
                pass

        i += 1

    return pd.DataFrame(
        subjects,
        columns=["Subject Code", "Subject Name", "Internal", "External", "Credits", "Grade"],
    )


def clean_data(df: pd.DataFrame, uid: str, name: str) -> pd.DataFrame:
    for col in ["Internal", "External", "Credits"]:
        df[col] = pd.to_numeric(df[col], errors="coerce")

    df["Grade"] = df["Grade"].astype(str).str.replace(" ", "").str.strip()
    df["UID"] = uid
    df["Name"] = name
    return df


def calculate_cgpa(df: pd.DataFrame) -> float:
    df = df.copy()
    df["Grade Points"] = df["Grade"].map(GRADE_POINTS)

    valid_df = df[
        (df["Credits"].notna())
        & (df["Credits"] > 0)
        & (df["Grade Points"].notna())
    ].copy()

    if valid_df.empty:
        return 0.0

    valid_df["Credit Points"] = valid_df["Credits"] * valid_df["Grade Points"]
    total_credit_points = valid_df["Credit Points"].sum()
    total_credits = valid_df["Credits"].sum()
    if total_credits == 0:
        return 0.0
    return round(float(total_credit_points / total_credits), 2)


def read_pdf_text(pdf_path: Path) -> str:
    ocr_engine = RapidOCR() if RapidOCR is not None else None
    with pdfplumber.open(str(pdf_path)) as pdf:
        parts = []
        for page in pdf.pages:
            text = page.extract_text() or ""

            # Fallback for scanned/image-only PDFs.
            if not text.strip() and ocr_engine is not None:
                image = page.to_image(resolution=300).original
                ocr_result, _ = ocr_engine(np.array(image))
                if ocr_result:
                    text = "\n".join([item[1] for item in ocr_result])

            parts.append(text)
    return "\n".join(parts)


def resolve_pdf_files(input_path: Path):
    if input_path.is_file() and input_path.suffix.lower() == ".pdf":
        return [input_path]

    if input_path.is_dir():
        return sorted([p for p in input_path.iterdir() if p.suffix.lower() == ".pdf"])

    return []


def default_output_path() -> Path:
    downloads = Path.home() / "Downloads"
    downloads.mkdir(parents=True, exist_ok=True)
    stamp = dt.datetime.now().strftime("%Y%m%d_%H%M%S")
    return downloads / f"all_students_{stamp}.csv"


def process_pdfs(input_path: Path, output_csv: Path) -> pd.DataFrame:
    all_students = []
    pdf_files = resolve_pdf_files(input_path)

    if not pdf_files:
        raise FileNotFoundError(f"No PDF files found at: {input_path}")

    for pdf_file in pdf_files:
        try:
            text = read_pdf_text(pdf_file)
            uid, name = extract_student_info(text)
            df = extract_subjects(text)

            if df.empty:
                print(f"Skipped {pdf_file.name}: no data extracted")
                continue

            df = clean_data(df, uid, name)
            cgpa = calculate_cgpa(df)
            df["CGPA"] = cgpa
            all_students.append(df)
            print(f"Processed {pdf_file.name}: {name} | subjects={len(df)} | cgpa={cgpa}")
        except Exception as exc:
            print(f"Error in {pdf_file.name}: {exc}")

    if not all_students:
        raise RuntimeError("No valid rows extracted from input PDFs")

    final_df = pd.concat(all_students, ignore_index=True)
    final_df.to_csv(output_csv, index=False)
    return final_df


def parse_args():
    parser = argparse.ArgumentParser(
        description="Parse one PDF or a folder of PDFs and save consolidated CSV."
    )
    parser.add_argument(
        "input",
        help="Path to a PDF file or a folder that contains PDF files",
    )
    parser.add_argument(
        "--output",
        help="Optional output CSV path. Defaults to Downloads/all_students_<timestamp>.csv",
    )
    return parser.parse_args()


def main():
    args = parse_args()
    input_path = Path(args.input).expanduser().resolve()
    output_path = Path(args.output).expanduser().resolve() if args.output else default_output_path()

    if RapidOCR is None:
        print("Warning: OCR fallback not available. Install dependencies from tools/requirements-pdf.txt")

    final_df = process_pdfs(input_path, output_path)
    print(f"CSV saved: {output_path}")
    print(f"Total students: {final_df['UID'].nunique()}")
    print(f"Total rows: {len(final_df)}")


if __name__ == "__main__":
    main()
