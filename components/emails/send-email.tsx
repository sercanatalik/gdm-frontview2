
import { render } from '@react-email/components';
import Email  from './financing-email';


const emailHtml = await render(<Email/>);
console.log(emailHtml);

export default emailHtml;