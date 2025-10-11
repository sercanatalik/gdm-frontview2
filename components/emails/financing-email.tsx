
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

interface EmailProps {
  subject?: string;
  content?: string;
}

export const Email = ({subject = "Financing Report", content = ""}: EmailProps) => {
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
        }}>{content || "No content available"}</Markdown>
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