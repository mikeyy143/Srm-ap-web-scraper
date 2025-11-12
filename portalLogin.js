import puppeteer from "puppeteer";
import fs from "fs";
import fetch from "node-fetch";
import readline from "readline";
import * as cheerio from "cheerio";
import terminalImage from "terminal-image";


const ask = async (question) => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
};

const main = async () => {
  try {
    console.log("Launching browser...");
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    const loginUrl =
      "https://student.srmap.edu.in/srmapstudentcorner/StudentLoginPage";
    await page.goto(loginUrl, { waitUntil: "networkidle2" });

    // STEP 1: Extract session cookie
    const cookies = await page.cookies();
    const jsession = cookies.find((c) => c.name === "JSESSIONID");
    const jsessionValue = jsession?.value;
    console.log("JSESSIONID:", jsessionValue);

    // STEP 2: Get captcha for this session
    const captchaUrl = "https://student.srmap.edu.in/srmapstudentcorner/captchas";
    await page.setCookie({
      name: "JSESSIONID",
      value: jsessionValue,
      domain: "student.srmap.edu.in",
      path: "/srmapstudentcorner",
    });

    const captchaResponse = await page.goto(captchaUrl, {
      waitUntil: "domcontentloaded",
    });
   
    const captchaBuffer = await captchaResponse.buffer();
    fs.writeFileSync("captcha.png", captchaBuffer);
    try{
    const image= await terminalImage.buffer(captchaBuffer);
      console.log(image);
      console.log("Enter captcha");
   }
   catch{
    console.log("Error!");
   }
    console.log("Captcha saved as captcha.png");

    await browser.close();

    // STEP 3: Ask for captcha input
    const ccode = await ask("Enter captcha code: ");

    // STEP 4: Login via POST
    console.log("Logging in...");

    const loginForm = new URLSearchParams();
    loginForm.append("txtUserName", "AP24110010834");
    loginForm.append("txtAuthKey", "Temp@1234");
    loginForm.append("ccode", ccode);

    const loginResponse = await fetch(
      "https://student.srmap.edu.in/srmapstudentcorner/StudentLoginToPortal",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Cookie: `JSESSIONID=${jsessionValue}`,
          Referer:
            "https://student.srmap.edu.in/srmapstudentcorner/StudentLoginPage",
        },
        body: loginForm.toString(),
      }
    );

    const loginHtml = await loginResponse.text();
    
    console.log("Login successful");

    // STEP 5: Request attendance report
    console.log("Fetching attendance report...");

    const reportForm = new URLSearchParams();
    reportForm.append("ids", "3");

    const reportResponse = await fetch(
      "https://student.srmap.edu.in/srmapstudentcorner/students/report/studentreportresources.jsp",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Cookie: `JSESSIONID=${jsessionValue}`,
          Referer:
            "https://student.srmap.edu.in/srmapstudentcorner/StudentLoginPage",
        },
        body: reportForm.toString(),
      }
    );

    const reportHtml = await reportResponse.text();
  
    console.log("Attendance report being extracted");


    console.log("Extracting data...");

    const $ = cheerio.load(reportHtml);
    const rows = $("#tblSubjectWiseAttendance tr");
    const attendanceData = [];

    for (const row of rows) {
      const tds = $(row).find("td");
      if (tds.length === 9) {
        attendanceData.push({
          subjectCode: $(tds[0]).text().trim(),
          subjectName: $(tds[1]).text().trim(),
          classesConducted: $(tds[2]).text().trim(),
          present: $(tds[3]).text().trim(),
          attendancePercent: $(tds[8]).text().trim(),
        });
      }
    }
    fs.writeFileSync("attendance.json", JSON.stringify(attendanceData, null, 2));
    console.log("\n Attendance Data Extracted:");
    console.table(attendanceData);
    console.log("Saved to attendance.json");
  } catch (error) {
    console.error("Error:", error);
  }
};

await main();
