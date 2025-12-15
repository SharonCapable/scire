// Sample educational content to seed the database
export const sampleCourses = [
    {
        title: "Introduction to Computer Science",
        description: "Learn the fundamentals of computer science including algorithms, data structures, and programming concepts. Perfect for beginners starting their tech journey.",
        sourceType: "OpenStax",
        sourceUrl: "https://openstax.org/details/books/introduction-computer-science",
        content: `# Introduction to Computer Science

## What is Computer Science?

Computer Science is the study of computers and computational systems. Unlike electrical and computer engineers, computer scientists deal mostly with software and software systems; this includes their theory, design, development, and application.

## Core Concepts

### 1. Algorithms
An algorithm is a step-by-step procedure for solving a problem or accomplishing a task. Think of it as a recipe for your computer.

**Example**: Finding the largest number in a list
1. Start with the first number as the current maximum
2. Compare each subsequent number with the current maximum
3. If a number is larger, make it the new maximum
4. Continue until all numbers are checked

### 2. Data Structures
Data structures are ways of organizing and storing data so that it can be accessed and modified efficiently.

**Common Data Structures**:
- **Arrays**: Ordered collections of elements
- **Linked Lists**: Chains of nodes containing data and pointers
- **Stacks**: Last-In-First-Out (LIFO) structures
- **Queues**: First-In-First-Out (FIFO) structures
- **Trees**: Hierarchical structures with parent-child relationships
- **Graphs**: Networks of connected nodes

### 3. Programming Fundamentals

**Variables**: Containers for storing data values
\`\`\`
let age = 25;
let name = "Alice";
\`\`\`

**Conditionals**: Making decisions in code
\`\`\`
if (age >= 18) {
  console.log("Adult");
} else {
  console.log("Minor");
}
\`\`\`

**Loops**: Repeating actions
\`\`\`
for (let i = 0; i < 5; i++) {
  console.log(i);
}
\`\`\`

## Computational Thinking

Computational thinking involves:
1. **Decomposition**: Breaking down complex problems into smaller parts
2. **Pattern Recognition**: Finding similarities and patterns
3. **Abstraction**: Focusing on important information, ignoring irrelevant details
4. **Algorithm Design**: Creating step-by-step solutions

## Real-World Applications

- **Web Development**: Creating websites and web applications
- **Mobile Apps**: Building iOS and Android applications
- **Artificial Intelligence**: Machine learning, natural language processing
- **Cybersecurity**: Protecting systems and data
- **Game Development**: Creating interactive entertainment
- **Data Science**: Analyzing and interpreting complex data

## Getting Started

To begin your journey in computer science:
1. Choose a programming language (Python is great for beginners)
2. Practice coding daily with small projects
3. Learn problem-solving through coding challenges
4. Build projects that interest you
5. Join coding communities and collaborate

Remember: Every expert was once a beginner. The key is consistent practice and curiosity!`,
    },
    {
        title: "Biology: The Science of Life",
        description: "Explore the fascinating world of living organisms, from cells to ecosystems. Understand how life works at every level.",
        sourceType: "OpenStax",
        sourceUrl: "https://openstax.org/details/books/biology-2e",
        content: `# Biology: The Science of Life

## Introduction to Biology

Biology is the scientific study of life. It encompasses everything from the smallest bacteria to the largest whales, from individual cells to entire ecosystems.

## The Characteristics of Life

All living organisms share these characteristics:

1. **Organization**: Living things are highly organized structures
2. **Metabolism**: Chemical processes that maintain life
3. **Homeostasis**: Maintaining stable internal conditions
4. **Growth**: Increase in size and complexity
5. **Reproduction**: Creating new organisms
6. **Response to Stimuli**: Reacting to environmental changes
7. **Evolution**: Populations change over time

## The Cell: Basic Unit of Life

### Cell Theory
1. All living things are made of cells
2. Cells are the basic unit of life
3. All cells come from pre-existing cells

### Types of Cells

**Prokaryotic Cells** (Bacteria and Archaea):
- No nucleus
- Simple structure
- Smaller size (1-10 μm)
- DNA in nucleoid region

**Eukaryotic Cells** (Animals, Plants, Fungi, Protists):
- Have a nucleus
- Complex organelles
- Larger size (10-100 μm)
- DNA in chromosomes within nucleus

### Key Organelles

- **Nucleus**: Control center containing DNA
- **Mitochondria**: Powerhouse of the cell (energy production)
- **Ribosomes**: Protein synthesis
- **Endoplasmic Reticulum**: Protein and lipid processing
- **Golgi Apparatus**: Packaging and shipping center
- **Chloroplasts** (plants only): Photosynthesis

## DNA and Genetics

### The Structure of DNA
DNA (Deoxyribonucleic Acid) is a double helix made of:
- **Nucleotides**: Building blocks containing:
  - Sugar (deoxyribose)
  - Phosphate group
  - Nitrogenous base (A, T, G, C)

### Base Pairing Rules
- Adenine (A) pairs with Thymine (T)
- Guanine (G) pairs with Cytosine (C)

### From DNA to Proteins
1. **Transcription**: DNA → RNA
2. **Translation**: RNA → Protein

## Evolution and Natural Selection

### Darwin's Theory
Evolution occurs through natural selection:
1. **Variation**: Individuals differ in traits
2. **Inheritance**: Traits are passed to offspring
3. **Selection**: Some traits increase survival
4. **Time**: Populations change over generations

### Evidence for Evolution
- Fossil record
- Comparative anatomy
- Molecular biology (DNA similarities)
- Biogeography
- Direct observation

## Ecology: Organisms and Their Environment

### Levels of Organization
1. **Individual**: Single organism
2. **Population**: Same species in an area
3. **Community**: All species in an area
4. **Ecosystem**: Community + physical environment
5. **Biosphere**: All ecosystems on Earth

### Energy Flow
- **Producers**: Plants (photosynthesis)
- **Consumers**: Animals (eat other organisms)
- **Decomposers**: Break down dead matter

### Nutrient Cycles
- Carbon cycle
- Nitrogen cycle
- Water cycle
- Phosphorus cycle

## Human Body Systems

### Major Systems
1. **Nervous System**: Communication and control
2. **Circulatory System**: Transport of materials
3. **Respiratory System**: Gas exchange
4. **Digestive System**: Breaking down food
5. **Immune System**: Defense against disease
6. **Skeletal System**: Support and protection
7. **Muscular System**: Movement
8. **Endocrine System**: Hormone regulation

## Applications of Biology

- **Medicine**: Understanding disease and developing treatments
- **Agriculture**: Improving crop yields and sustainability
- **Biotechnology**: Genetic engineering, vaccines
- **Conservation**: Protecting endangered species
- **Forensics**: DNA analysis for crime solving
- **Environmental Science**: Addressing climate change

## Study Tips

1. Draw diagrams to visualize concepts
2. Use mnemonics for memorization
3. Connect concepts to real-life examples
4. Practice with flashcards
5. Teach concepts to others

Biology is everywhere around us. Understanding it helps us appreciate the complexity and beauty of life!`,
    },
    {
        title: "Introduction to Psychology",
        description: "Discover how the human mind works. Learn about behavior, cognition, emotions, and mental processes.",
        sourceType: "OpenStax",
        sourceUrl: "https://openstax.org/details/books/psychology-2e",
        content: `# Introduction to Psychology

## What is Psychology?

Psychology is the scientific study of the mind and behavior. It seeks to understand individuals and groups by establishing general principles and researching specific cases.

## Major Perspectives in Psychology

### 1. Biological Perspective
- Focuses on physical and biological bases of behavior
- Studies brain structure, neurotransmitters, genetics
- Example: How does serotonin affect mood?

### 2. Cognitive Perspective
- Examines mental processes like thinking, memory, problem-solving
- Studies how we perceive, learn, and remember
- Example: How do we make decisions?

### 3. Behavioral Perspective
- Focuses on observable behaviors
- Studies how environment shapes behavior through learning
- Example: Classical and operant conditioning

### 4. Humanistic Perspective
- Emphasizes personal growth and self-actualization
- Focuses on free will and human potential
- Example: Maslow's hierarchy of needs

### 5. Psychodynamic Perspective
- Examines unconscious drives and early experiences
- Based on Freud's theories
- Example: How do childhood experiences shape personality?

### 6. Sociocultural Perspective
- Studies how social and cultural factors influence behavior
- Examines group dynamics and cultural norms
- Example: How does culture affect perception?

## The Brain and Behavior

### Brain Structure

**Major Brain Regions**:
- **Cerebral Cortex**: Higher-order thinking, consciousness
- **Limbic System**: Emotions, memory (includes amygdala, hippocampus)
- **Cerebellum**: Coordination and balance
- **Brainstem**: Basic life functions (breathing, heart rate)

### Neurotransmitters

Chemical messengers that affect mood and behavior:
- **Dopamine**: Pleasure, reward, motivation
- **Serotonin**: Mood, sleep, appetite
- **GABA**: Calming, reduces anxiety
- **Glutamate**: Learning, memory
- **Norepinephrine**: Alertness, arousal

## Learning and Memory

### Types of Learning

**Classical Conditioning** (Pavlov):
- Learning through association
- Example: Dog salivates at bell sound

**Operant Conditioning** (Skinner):
- Learning through consequences
- Reinforcement increases behavior
- Punishment decreases behavior

**Observational Learning** (Bandura):
- Learning by watching others
- Example: Children imitating adults

### Memory Systems

**Sensory Memory**: Brief storage (< 1 second)
**Short-Term Memory**: Limited capacity (7±2 items), ~20 seconds
**Long-Term Memory**: Unlimited capacity, permanent storage

**Types of Long-Term Memory**:
- **Explicit** (conscious):
  - Episodic: Personal experiences
  - Semantic: Facts and knowledge
- **Implicit** (unconscious):
  - Procedural: Skills and habits
  - Priming: Unconscious associations

## Development Across the Lifespan

### Piaget's Stages of Cognitive Development

1. **Sensorimotor** (0-2 years): Learning through senses and actions
2. **Preoperational** (2-7 years): Symbolic thinking, egocentrism
3. **Concrete Operational** (7-11 years): Logical thinking about concrete objects
4. **Formal Operational** (12+ years): Abstract reasoning

### Erikson's Psychosocial Stages

Each stage involves a crisis to resolve:
1. Trust vs. Mistrust (infancy)
2. Autonomy vs. Shame (toddlerhood)
3. Initiative vs. Guilt (preschool)
4. Industry vs. Inferiority (school age)
5. Identity vs. Role Confusion (adolescence)
6. Intimacy vs. Isolation (young adulthood)
7. Generativity vs. Stagnation (middle adulthood)
8. Integrity vs. Despair (late adulthood)

## Personality

### The Big Five Personality Traits (OCEAN)

1. **Openness**: Creativity, curiosity
2. **Conscientiousness**: Organization, responsibility
3. **Extraversion**: Sociability, energy
4. **Agreeableness**: Kindness, cooperation
5. **Neuroticism**: Emotional stability

## Psychological Disorders

### Common Disorders

**Anxiety Disorders**:
- Generalized Anxiety Disorder (GAD)
- Panic Disorder
- Phobias
- Social Anxiety Disorder

**Mood Disorders**:
- Major Depressive Disorder
- Bipolar Disorder

**Schizophrenia Spectrum**:
- Hallucinations
- Delusions
- Disorganized thinking

**Obsessive-Compulsive Disorder (OCD)**:
- Intrusive thoughts
- Compulsive behaviors

### Treatment Approaches

**Psychotherapy**:
- Cognitive-Behavioral Therapy (CBT)
- Psychodynamic therapy
- Humanistic therapy
- Group therapy

**Biomedical**:
- Medications (antidepressants, antipsychotics, anxiolytics)
- Electroconvulsive therapy (ECT)
- Transcranial magnetic stimulation (TMS)

## Social Psychology

### Social Influence

**Conformity**: Changing behavior to match group norms
- Asch's line study

**Obedience**: Following orders from authority
- Milgram's shock experiment

**Group Dynamics**:
- Social facilitation: Better performance with audience
- Social loafing: Less effort in groups
- Groupthink: Desire for harmony leads to poor decisions

### Attitudes and Persuasion

**Cognitive Dissonance**: Discomfort from conflicting beliefs
**Persuasion Techniques**:
- Central route: Logical arguments
- Peripheral route: Superficial cues

## Applications of Psychology

- **Clinical Psychology**: Mental health treatment
- **Counseling**: Personal and career guidance
- **Industrial-Organizational**: Workplace behavior
- **Educational**: Learning and teaching
- **Sports Psychology**: Athletic performance
- **Forensic**: Legal system applications
- **Health Psychology**: Promoting wellness

## Research Methods

**Experimental Method**: Manipulate variables to determine cause-effect
**Correlational Method**: Examine relationships between variables
**Case Studies**: In-depth analysis of individuals
**Surveys**: Collect data from large groups
**Naturalistic Observation**: Observe behavior in natural settings

## Ethical Considerations

- Informed consent
- Confidentiality
- Debriefing
- Protection from harm
- Deception only when necessary

Understanding psychology helps us better understand ourselves and others, improve relationships, and enhance mental well-being!`,
    },
];
