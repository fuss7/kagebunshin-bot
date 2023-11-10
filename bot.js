const puppeteer = require('puppeteer');
const axios = require('axios');
const fs = require('fs/promises');

async function main() {
  showLoadingAnimation();

  await new Promise((resolve) => setTimeout(resolve, 5000));

  while (true) {
    const browser = await puppeteer.launch({ headless: false, slowMo: 50 });
    const page = await browser.newPage();

    await page.setViewport({ width: 1536, height: 695 });

    let bearerToken = null;

    page.on('request', async (request) => {
      if (request.url().includes('https://api.picsart.com/shop/subscription/info?expand=true')) {
        const headers = request.headers();
        if (headers['authorization'] && headers['authorization'].startsWith('Bearer ')) {
          bearerToken = headers['authorization'].split('Bearer ')[1];
          console.log('Bearer Token:', bearerToken);
        }
      }
    });

    try {
      const currentTime = new Date().toLocaleTimeString();
      console.log(`[${currentTime}] Navigating to the site..`);
      await page.goto('https://picsart.com/discord-nitro-plan-trial/');

      await page.waitForSelector('#onetrust-accept-btn-handler');
      await page.hover('#onetrust-accept-btn-handler');

      const rejectAllButton = await page.$('#onetrust-reject-all-handler');
      if (rejectAllButton) {
        await page.click('#onetrust-reject-all-handler');
      } else {console.log(`[${currentTime}] Please wait..`);
      }

      console.log(`[${currentTime}] Signing-up`);
      await page.waitForSelector('[data-test="login-signup-button"]');
      await page.click('[data-test="login-signup-button"]');

      console.log(`[${currentTime}] Signing-up with email`);
      await page.waitForSelector('[aria-label="Sign in with Email"]');
      await page.click('[aria-label="Sign in with Email"]');

      const randomEmail = generateRandomEmail();
      const randomPassword = generateRandomPassword();

      console.log(`[${currentTime}] Typing email..`);
      await page.waitForSelector('[data-testid="text-control-input"]:not([disabled])');
      await page.type('[data-testid="text-control-input"]', randomEmail);

      await page.waitForSelector('[data-testid="text-control-input"]');
      await page.keyboard.press('Enter');

      console.log(`[${currentTime}] Typing password..`);
      await page.waitForXPath('//input[@name="password"]');
      const passwordInput = await page.$x('//input[@name="password"]');
      if (passwordInput.length > 0) {
        await passwordInput[0].type(randomPassword);
      }

      await page.keyboard.press('Enter');

      while (!bearerToken) {
        console.log(`[${currentTime}] Waiting for the Bearer Token...`);
        await page.waitForTimeout(1000);
      }

      if (bearerToken) {
        const response = await axios.get('https://api.picsart.com/discord/link', {
          headers: {
            Authorization: `Bearer ${bearerToken}`,
          },
        });

        const link = response.data.response;
        console.log(`[${currentTime}] Response from https://api.picsart.com/discord/link:`);
        console.log(link);

        const resultText = `Email: ${randomEmail}\nPassword: ${randomPassword}\nLink: ${link}\n`;

        const fileHandle = await fs.open('result.txt', 'a');

        await fileHandle.appendFile(resultText);
        await fileHandle.close();

        const linksFileHandle = await fs.open('links.txt', 'a');
        await linksFileHandle.appendFile(link + '\n');
        await linksFileHandle.close();
      }
    } catch (error) {
      console.error('An error occurred:', error);
    } finally {
      console.log('Closing the browser');
      await browser.close();
    }
  }
}

function generateRandomEmail() {
  const randomString = Math.random().toString(36).substring(2, 12);
  return `${randomString}@gmail.com`;
}

function generateRandomPassword() {
  const minLength = 8;
  const maxLength = 16;
  const validChars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

  const passwordLength = Math.floor(Math.random() * (maxLength - minLength + 1)) + minLength;

  let password = '';
  let hasLetter = false;
  let hasNumber = false;

  for (let i = 0; i < passwordLength; i++) {
    const randomChar = validChars[Math.floor(Math.random() * validChars.length)];
    password += randomChar;

    if (/^[a-zA-Z]$/.test(randomChar)) {
      hasLetter = true;
    } else if (/^\d$/.test(randomChar)) {
      hasNumber = true;
    }
  }

  if (!hasLetter) {
    const randomLetter = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 52)];
    const randomIndex = Math.floor(Math.random() * passwordLength);
    password = password.substring(0, randomIndex) + randomLetter + password.substring(randomIndex + 1);
  }

  if (!hasNumber) {
    const randomNumber = Math.floor(Math.random() * 10).toString();
    const randomIndex = Math.floor(Math.random() * passwordLength);
    password = password.substring(0, randomIndex) + randomNumber + password.substring(randomIndex + 1);
  }

  return password;
}

function showLoadingAnimation() {
  const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  let i = 0;
  const intervalId = setInterval(() => {
    process.stdout.write('\r' + frames[i % frames.length] + ' Loading... Made with ❤️ by borgirholic.eth // Stress Capital');
    i++;
  }, 100);

  setTimeout(() => {
    clearInterval(intervalId);
    console.log('\n');
  }, 5000);
}

main().catch((error) => {
  console.error('An error occurred:', error);
});
