export const metadata = { title: 'About - StoryVerse' };

export default function AboutPage() {
  return (
    <div className="container py-24 max-w-4xl">
      <h1 className="text-4xl font-bold mb-6">About StoryVerse</h1>
      <div className="prose prose-lg max-w-none">
        <p className="text-xl text-muted-foreground mb-8">
          The platform that grows up with your child. From kindergarten to graduation.
        </p>
        
        <h2>Our Mission</h2>
        <p>
          We believe every child deserves to be the hero of their own story. StoryVerse combines 
          cutting-edge AI with the timeless magic of storytelling to create personalized books 
          that evolve as your child grows.
        </p>

        <h2>18 Years. One Story.</h2>
        <p>
          Unlike traditional personalized book platforms that focus on one-off purchases for 
          toddlers, StoryVerse is designed for the long journey. Your child starts as the hero 
          of picture books and gradually becomes the author of their own young adult novels.
        </p>

        <h2>What Makes Us Different</h2>
        <ul>
          <li><strong>Story Memory:</strong> Our AI remembers characters, events, and preferences across every book</li>
          <li><strong>Voice Cloning:</strong> Narrate bedtime stories in your own voice, even when traveling</li>
          <li><strong>Growing Control:</strong> Parents create early, children take over as authors by teen years</li>
          <li><strong>Graduation Anthology:</strong> At 18, receive a hardcover collection of their entire journey</li>
        </ul>
      </div>
    </div>
  );
}
