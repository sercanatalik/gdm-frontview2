
import {
  Body,
  Button,
  Container,
  Head,
  Hr,
  Markdown, Html ,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';

const baseUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : '';
export const Email = ({subject,content}) => {
  return (
    <Html>
    <Head />
    <Preview>{subject}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={box}>

          <Markdown
           markdownCustomStyles={{
          h1: { color: "grey" },
          h2: { color: "grey" },
          codeInline: { background: "grey" },
        }}
        markdownContainerStyles={{
          padding: "10px",
          border: "solid 1px black",
        }}>{`## Total Funding Amount by Counterparty

Here's the breakdown of total funding amounts across all counterparties (using the latest available data):

| Counterparty | Total Funding Amount | Position Count |
|-------------|---------------------|----------------|
| Roberts Group | $3,005,495,170 | 153 |
| Delacruz, Santos and Gibson | $2,974,720,151 | 150 |
| Kelley-Thompson | $2,945,136,064 | 155 |
| Hahn LLC | $2,898,587,882 | 160 |
| Thompson-Parker | $2,851,369,161 | 147 |
| Barnes and Sons | $2,827,111,039 | 145 |
| Smith, Dougherty and Garza | $2,786,022,110 | 148 |
| Little, Garcia and Jennings | $2,727,158,355 | 145 |
| Owens LLC | $2,710,626,479 | 153 |
| Barnes, Boyd and Ford | $2,651,418,209 | 133 |
| Smith, Cameron and Brown | $2,645,217,420 | 136 |
| Lopez, Evans and Mcdonald | $2,639,721,845 | 132 |
| Anderson Ltd | $2,634,404,474 | 148 |
| Mcgee, Price and Valenzuela | $2,593,212,381 | 151 |
| Johnson LLC | $2,588,576,413 | 133 |

**Summary:**
- **Total of 50 counterparties** shown
- **Top counterparty**: Roberts Group with ~$3.0 billion in funding
- **Total aggregate funding**: ~$120 billion across all counterparties
- **Average positions per counterparty**: ~136 positions

The data shows relatively balanced exposure across the top counterparties, with funding amounts ranging from approximately $1.8 billion to $3.0 billion.
          `}</Markdown>
           <Hr style={hr} />
                    <Text style={footer}>
                      AI generated content by&nbsp;
                      <Link href={baseUrl} className="text-red-600 no-underline">
                GDM Frontview 
              </Link> - Remember AI can make mistakes!
                    </Text>
                    
                     
        </Section>
      </Container>
    </Body>
  </Html>
  );
};


const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '10px 0 24px',
  marginBottom: '24px',
};

const box = {
  padding: '0 24px',
};

const hr = {
  borderColor: '#e6ebf1',
  margin: '10px 0',
};

const footer = {
  color: '#8898aa',
  fontSize: '10px',
  lineHeight: '16px',
};


export default Email;