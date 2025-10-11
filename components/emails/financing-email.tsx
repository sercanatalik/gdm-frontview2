
import {
  Body,
  Button,
  Container,
  Head,
  Hr,
  Markdown, Html ,
  Img,
  Link,
  Preview,Heading,
  Section,
  Text,
} from '@react-email/components';

const baseUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}/gdm-frontview`
  : '/gdm-frontview';

interface EmailProps {
  subject?: string;
  content?: string;
  imagePaths?: string[];
}

export const Email = ({subject = "Financing Report", content = "", imagePaths = []}: EmailProps) => {
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
          border: "0px",
        }}>{content || "No content available"}</Markdown>
        <Heading as="h4">AI Generated Charts</Heading>;

           {imagePaths.length > 0 && (
             <Section style={{ marginTop: '20px' }}>
               {imagePaths.map((imagePath, index) => (
                 <Img
                   key={index}
                   src={baseUrl + `/tmp/${imagePath}`}
                   alt={`Chart ${index + 1}`}
                   style={imageStyle}
                 />
               ))}
             </Section>
           )}

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

const imageStyle = {
  width: '100%',
  maxWidth: '600px',
  height: 'auto',
  margin: '10px 0',
  border: '1px solid #e6ebf1',
  borderRadius: '4px',
};


export default Email;