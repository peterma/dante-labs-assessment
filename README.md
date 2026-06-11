## Frontend task( 30 mins ~ 2 hrs )
### **Task Description: Authentication UI & Layout Fix**
You are tasked with improving the user authentication experience by fixing layout issues and enhancing the login/signup pages.

**Part 1: Navigation Bar Fix** (30 minutes)
- **Issue**: Top navigation tabs are misaligned and visually unbalanced
- **Reference**: 
  - Current issues: https://i.postimg.cc/bYBK0TDN/issue.png
  - Expected result: https://i.postimg.cc/66bNjKSK/result.png
- **Requirements**:
  - Center-align all menu elements horizontally
  - Ensure consistent spacing between navigation items
  - Maintain responsive behavior across different screen sizes
  - Fix any CSS flexbox/grid alignment issues

**Part 2: Login/Signup Page Enhancement** (1-1.5 hours)
- **Location**: `/src/components/auth/` directory (you may need to create this structure)
- **Current Issues to Address**:
  1. Improve form validation with real-time feedback
  2. Add loading states during authentication processes
  3. Implement password strength indicator
  4. Add "Remember me" functionality
  5. Include social login options (Google/GitHub) placeholder
  6. Improve mobile responsiveness
  7. Add form accessibility features (ARIA labels, keyboard navigation)
- **Design Requirements**:
  - Create a clean, modern authentication interface
  - Implement smooth transition between login/signup modes
  - Add error state styling for invalid inputs
  - Include success confirmation after actions
- **Technical Requirements**:
  - Use React hooks for state management
  - Implement form validation using a library (Formik/Yup or React Hook Form)
  - Ensure all interactive elements have proper focus states
  - Write clean, maintainable CSS (CSS Modules, styled-components, or Tailwind)

**Expected Deliverables**:
1. Fixed navigation bar with centered, properly aligned elements
2. Enhanced login/signup component with improved UX/UI
3. Brief explanation of your design decisions and implementation approach

**Skills Tested**: React, CSS/SCSS, Responsive Design, UI/UX Principles, Form Handling, Accessibility

## Backend task( 1 ~ 2 hrs )

### **Task Description:**

Complete Log in Operation
- Location: /src/components/login/index.tsx 
- Issue: Implement missing login operations by password and email 
- Skills Tested: Node.js, Express, PostgreSQL, API design, Error handling 
- Expected Implementation: Full login operations

## Blockchain task( 40 mins ~ 1 hour )

### **Task Description:** 
Creation of a new API into the shared project that can integrate with smart contracts 

- Please add a new API into the backend (Next serverless backend) .
- And you have to fetch some info on any smart contracts(made by your self) from Solana/EVM chain through the API.

## Submission

You don’t need to push the result to the repository. We will check the result in the technical interview with our technical leader. Be prepared to demonstrate the feature you implemented and explain your testing approach.


## How to use
```cmd
-Envirionment
node version : 22.0.0

-Instruction
npm i

npm start
```


